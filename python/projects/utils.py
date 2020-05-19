import requests
import os
import datetime
import xhtml2pdf.pisa as pisa

from django.views.generic.base import ContextMixin
from django.conf import settings
from django import template
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.urls import reverse_lazy
from django.core.mail import EmailMessage

from .models import Project, Folder, Item, ItemEthTx, ProfileItemEthAdd, ItemWork
from forgeplatform.profiles.utils import (
    get_or_create_ethereum_ropsten_address_for_profile_id,
    get_eth_contract_address,
)


class IsProjectOwnerMixin(ContextMixin):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if type(self.object) == Project:
            profile_id = self.object.profile_id
        elif type(self.object) == Folder:
            profile_id = self.object.project.profile_id
        elif type(self.object) == Item:
            profile_id = self.object.project.profile_id
        if profile_id == self.request.user.id:
            context['project_owner'] = True
        else:
            context['project_owner'] = False
        return context


class IsItemOwnerMixin(ContextMixin):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if 'item_pk' in self.kwargs:
            item_id = self.kwargs['item_pk']
            item = Item.objects.get(pk=item_id)
        elif type(self.object) == Item:
            item = self.object
        else:
            item = self.object.item
        context['item'] = item
        if item.project.profile.id == self.request.user.id:
            context['item_owner'] = True
        else:
            context['item_owner'] = False
        return context

class IsInvitee(ContextMixin):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if type(self.object) == Item:
            invitee_id = self.object.invited_supplier.profile_id
        else:
            invitee_id = self.object.profile_id
        if  invitee_id == self.request.user.id:
            context['invitee'] = True
        else:
            context['invitee'] = False
        return context


class IsItemSupplierMixin(ContextMixin):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if 'item_pk' in self.kwargs:
            item_id = self.kwargs['item_pk']
        else:
            item_id = self.kwargs['pk']
        item = Item.objects.get(pk=item_id)
        if item.supplier.id == self.request.user.id:
            context['item_supplier'] = True
        else:
            context['item_supplier'] = False
        return context



class EthereumRopstenAddItemException(Exception):
    pass


class EthereumRopstenSetSupplierException(Exception):
    pass


class EthereumRopstenAddDesignException(Exception):
    pass


class EthereumRopstenApproveItemException(Exception):
    pass


def create_new_eth_address_for_item_user(item_id, profile_id):
    if ProfileItemEthAdd.objects.filter(item_id=item_id, profile_id=profile_id).exists():
        return ProfileItemEthAdd.objects.get(item_id=item_id, profile_id=profile_id).address
    address = get_or_create_ethereum_ropsten_address_for_profile_id(profile_id, force_create=True)
    ProfileItemEthAdd(
        profile_id=profile_id,
        item_id=item_id,
        address=address,
    ).save()
    return address


def add_item_for_ethereum_ropsten_address(item_id, profile_id):
    '''
    sample response https://ropsten.etherscan.io/tx/0x6e1980a6418b7bd1383d1f52e6d628e76e8d371de6debf0763fb8339aec717c2

    returns Etherium transaction code (part after 'tx/')
    '''
    
    full_url = settings.ETH_ROPSTEN_BASE_URL + settings.ADD_ITEM
    
    data = settings.ETH_ROPSTEN_ITEM_DATA
    data['item_id'] = item_id

    owner_eth_address = create_new_eth_address_for_item_user(item_id, profile_id)
    data['owner'] = owner_eth_address
    data['contractaddress'] = get_eth_contract_address()
    
    ethereum_response = requests.post(
        full_url,
        data=data,
    ).json()

    if ethereum_response['success']:
        tx_code = ethereum_response['message'].split('/')[-1]
        item_eth_tx = ItemEthTx()
        item_eth_tx.item_id = item_id
        item_eth_tx.tx_code = tx_code
        item_eth_tx.activity = ItemEthTx.ADD_ITEM
        item_eth_tx.save()
    else:
        raise EthereumRopstenAddItemException


def get_image_hash(image_url):
    endpoint_url = settings.BASE_URL + settings.HASH_ADDRESS
    data = {}
    data["image_url"] = image_url
    return requests.post(
        endpoint_url, 
        data=data,
    ).json()


def set_supplier(item_id, supplier_id):

    endpoint_url = settings.ETH_ROPSTEN_BASE_URL + settings.SET_SUPPLIER

    data = settings.ETH_ROPSTEN_SET_SUPPLIER_DATA
    data['item_id'] = item_id
    data['owner'] = ProfileItemEthAdd.objects.exclude(profile_id=supplier_id).get(item_id=item_id).address
    if ProfileItemEthAdd.objects.filter(item_id=item_id, profile_id=supplier_id).exists():
        supplier_eth_address = ProfileItemEthAdd.objects.get(item_id=item_id, profile_id=supplier_id).address
    else:
        supplier_eth_address = create_new_eth_address_for_item_user(item_id, supplier_id)
    data["supplier"] = supplier_eth_address
    data['contractaddress'] = get_eth_contract_address()

    ethereum_response = requests.post(
        endpoint_url,
        data=data,
    ).json()

    if ethereum_response['success']:
        tx_code = ethereum_response['message'].split('/')[-1]
        item_eth_tx = ItemEthTx()
        item_eth_tx.item_id = item_id
        item_eth_tx.tx_code = tx_code
        item_eth_tx.activity = ItemEthTx.SET_SUPPLIER
        item_eth_tx.save()
    else:
        raise EthereumRopstenSetSupplierException


def add_design(item_id, design_id, design_hash):

    endpoint_url = settings.ETH_ROPSTEN_BASE_URL + settings.ADD_DESIGN

    data = settings.ETH_ROPSTEN_ADD_DESIGN_DATA
    data['item_id'] = item_id
    item_eth_addresses = ProfileItemEthAdd.objects.filter(item_id=item_id)
    for item_eth_address in item_eth_addresses:
        if item_eth_address.is_supplier:
            data["design_owner"] = item_eth_address.address
        else:
            data["item_owner"] = item_eth_address.address
    data["design_id"] = design_id
    data["designHash"] = design_hash
    data['contractaddress'] = get_eth_contract_address()

    ethereum_response = requests.post(
        endpoint_url,
        data=data,
    ).json()

    if ethereum_response['success']:
        tx_code = ethereum_response['message'].split('/')[-1]
        item_eth_tx = ItemEthTx()
        item_eth_tx.item_id = item_id
        item_eth_tx.tx_code = tx_code
        item_eth_tx.activity = ItemEthTx.ADD_DESIGN
        item_eth_tx.item_work_id = design_id
        item_eth_tx.save()
    else:
        raise EthereumRopstenAddDesignException


def approve_item(item_id):

    endpoint_url = settings.ETH_ROPSTEN_BASE_URL + settings.APPROVE_ITEM

    data = settings.ETH_ROPSTEN_APPROVE_ITEM_DATA
    data['item_id'] = item_id
    item_eth_addresses = ProfileItemEthAdd.objects.filter(item_id=item_id)
    for item_eth_address in item_eth_addresses:
        if not item_eth_address.is_supplier:
            data["item_owner"] = item_eth_address.address
            break
    data['contractaddress'] = get_eth_contract_address()
    
    ethereum_response = requests.post(
        endpoint_url,
        data=data,
    ).json()

    if ethereum_response['success']:
        tx_code = ethereum_response['message'].split('/')[-1]
        item_eth_tx = ItemEthTx()
        item_eth_tx.item_id = item_id
        item_eth_tx.tx_code = tx_code
        item_eth_tx.activity = ItemEthTx.APPROVE_ITEM
        item_eth_tx.save()
    else:
        raise EthereumRopstenApproveItemException


def send_item_supplier_invite_email(request, item_supplier_invite):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_supplier_invite_email.html', {
        'user': item_supplier_invite.profile,
        'project': item_supplier_invite.item.project,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_view', kwargs={'pk': item_supplier_invite.item.project.pk}),
            item_supplier_invite.item.pk,
        ),
    })
    subject = 'New Project Invitation'
    item_supplier_invite.profile.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def send_item_owner_accepted_invite_email(request, item):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_owner_accepted_invite_email.html', {
        'user': item.project.profile,
        'project': item.project,
        'item': item,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_edit_view', kwargs={'pk': item.project.pk}),
            item.pk,
        ),
    })
    subject = '{} {} has accepted your invitation'.format(
        item.supplier.first_name,
        item.supplier.last_name,
    )
    item.project.profile.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def send_item_owner_declined_invite_email(request, item_supplier_invite):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_owner_declined_invite_email.html', {
        'user': item_supplier_invite.item.project.profile,
        'invitee': item_supplier_invite.profile,
        'comments': item_supplier_invite.comments,
        'project': item_supplier_invite.item.project,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_edit_view', kwargs={'pk': item_supplier_invite.item.project.pk}),
            item_supplier_invite.item.pk,
        ),
    })
    subject = 'Invitation declined'
    item_supplier_invite.item.project.profile.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def send_item_owner_supplier_applied_email(request, item_supplier_application):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_owner_supplier_applied_email.html', {
        'user': item_supplier_application.item.project.profile,
        'applicant': item_supplier_application.profile,
        'project': item_supplier_application.item.project,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_edit_view', kwargs={'pk': item_supplier_application.item.project.pk}),
            item_supplier_application.item.pk,
        ),
    })
    subject = 'Request to contribute: {} {} has applied to be considered on your project.'.format(
        item_supplier_application.profile.first_name,
        item_supplier_application.profile.last_name,
    )
    item_supplier_application.item.project.profile.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def send_item_supplier_application_accepted_email(request, item_supplier_application):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_supplier_application_accepted_email.html', {
        'user': item_supplier_application.profile,
        'project': item_supplier_application.item.project,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_view', kwargs={'pk': item_supplier_application.item.project.pk}),
            item_supplier_application.item.pk,
        ),
    })
    subject = 'Application accepted! {} {} is ready for you to start work'.format(
        item_supplier_application.item.project.profile.first_name,
        item_supplier_application.item.project.profile.last_name,
    )
    item_supplier_application.profile.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def send_item_owner_work_submitted_email(request, item):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_owner_work_submitted_email.html', {
        'user': item.project.profile,
        'project': item.project,
        'item': item,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_edit_view', kwargs={'pk': item.project.pk}),
            item.pk,
        ),
    })
    subject = '{} {} has submitted a design'.format(
        item.supplier.first_name,
        item.supplier.last_name,
    )
    item.project.profile.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def send_item_supplier_feedback_email(request, item):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_supplier_feedback_email.html', {
        'user': item.supplier,
        'project': item.project,
        'item': item,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_view', kwargs={'pk': item.project.pk}),
            item.pk,
        ),
    })
    subject = 'Feedback received. {} {} has provided feedback on your work'.format(
        item.project.profile.first_name,
        item.project.profile.last_name,
    )
    item.supplier.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def send_item_supplier_approval_email(request, item):
    current_site = get_current_site(request)
    message = render_to_string('projects/item_supplier_approval_email.html', {
        'user': item.supplier,
        'project': item.project,
        'item': item,
        'domain': current_site.domain,
        'item_url': '{}#top-item-{}'.format(
            reverse_lazy('project_view', kwargs={'pk': item.project.pk}),
            item.pk,
        ),
    })
    subject = 'Work accepted! Thanks, your work has been accepted by {} {}.'.format(
        item.project.profile.first_name,
        item.project.profile.last_name,
    )
    item.supplier.email_user(
        subject,
        '',
        settings.EMAIL_HOST_USER,
        html_message=message,
    )


def link_callback(uri, rel):
    """
    Convert HTML URIs to absolute system paths so xhtml2pdf can access those
    resources
    """
    # use short variable names
    sUrl = settings.STATIC_URL      # Typically /static/
    sRoot = settings.STATIC_ROOT    # Typically /home/userX/project_static/
    mUrl = settings.MEDIA_URL       # Typically /static/media/
    mRoot = settings.MEDIA_ROOT     # Typically /home/userX/project_static/media/

    # convert URIs to absolute system paths
    if uri.startswith(mUrl):
        path = os.path.join(mRoot, uri.replace(mUrl, ""))
    elif uri.startswith(sUrl):
        path = os.path.join(sRoot, uri.replace(sUrl, ""))
    else:
        return uri  # handle absolute uri (ie: http://some.tld/foo.png)

    # make sure that file exists
    if not os.path.isfile(path):
        raise Exception(
            'media URI must start with %s or %s' % (sUrl, mUrl)
        )
    return path


def create_invoice_for_item(item):
    current_date = datetime.datetime.now().strftime('%b %d %Y')
    invoice_html = render_to_string('projects/item_invoice.html', {'item': item, "current_date": current_date})
    invoice_name = os.path.join(settings.BASE_DIR, "media/invoices/item_{}_invoice.pdf".format(item.id))
    invoice_file = open(invoice_name, "w+b")
    pisaStatus = pisa.CreatePDF(
        invoice_html, dest=invoice_file, link_callback=link_callback,
    )
    invoice_file.close()
    return invoice_name


def create_cof_for_item(item):
    current_date = datetime.datetime.now().strftime('%b %d %Y')
    owner_address = ProfileItemEthAdd.objects.get(item=item, profile=item.project.profile).address  
    cof_html = render_to_string('projects/certificate_of_ownership.html', {'item': item, "current_date": current_date, 'owner_address': owner_address})
    cof_name = os.path.join(settings.BASE_DIR, "media/certificates_of_ownership/item_{}_certification_of_ownership.pdf".format(item.id))
    cof_file = open(cof_name, "w+b")
    pisaStatus = pisa.CreatePDF(
        cof_html, dest=cof_file, link_callback=link_callback,
    )
    cof_file.close()
    return cof_name


def send_item_owner_approval_email(item):
    if item.amends == item.work_submission_count:
        email_template = 'projects/item_owner_auto_approval_attachments_email.html'
    else:
        email_template = 'projects/item_owner_approval_attachments_email.html'
    html_content = render_to_string(email_template, {
        'item': item,
    })
    subject = 'Item Approved'
    msg = EmailMessage(subject, html_content, settings.EMAIL_HOST_USER, [item.project.profile.email])
    invoice_name = create_invoice_for_item(item)
    msg.attach_file(invoice_name)
    cof_name = create_cof_for_item(item)
    msg.attach_file(cof_name)
    msg.content_subtype = "html"  
    msg.send()


def generate_and_check_picture_hash(picture_url, item_id):
    design_url = settings.BASE_IMAGE_URL + picture_url
    design_hash = get_image_hash(design_url)
    if ItemWork.objects.filter(picture_hash=design_hash).exclude(item_id=item_id).exists():
        return False, design_hash
    return True, design_hash