from pdf2image import convert_from_path
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings
from django.shortcuts import render
from django.http import HttpResponse
from django.http import HttpResponseForbidden
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.views.generic.list import ListView
from django.views.generic import DetailView
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic.edit import (
    FormView,
    UpdateView,
    CreateView,
    DeleteView,
)
from django.core.exceptions import PermissionDenied
from django.urls import reverse_lazy
from django.db.models import Max

from .models import Project, Folder, Item, ItemSupplierApplication, ItemWork, ItemEthTx, ProfileItemEthAdd
from .utils import (
    IsProjectOwnerMixin,
    add_item_for_ethereum_ropsten_address,
    IsItemOwnerMixin,
    IsInvitee,
    IsItemSupplierMixin,
    set_supplier,
    get_image_hash,
    add_design,
    approve_item,
    send_item_supplier_invite_email,
    send_item_owner_accepted_invite_email,
    send_item_owner_declined_invite_email,
    send_item_owner_supplier_applied_email,
    send_item_supplier_application_accepted_email,
    send_item_owner_work_submitted_email,
    send_item_supplier_approval_email,
    send_item_supplier_feedback_email,
    generate_and_check_picture_hash,
)
from .forms import FolderForm, ItemForm, ProjectForm
from forgeplatform.profiles.models import Profile


class ProjectList(LoginRequiredMixin, PermissionRequiredMixin, ListView):

    model = Project
    paginate_by = 50
    template_name = 'projects/project_list.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['project_url'] = 'project_view'
        return context


class ProjectView(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, DetailView):
    
    model = Project
    template_name = 'projects/project_edit_view.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.object.project_items.filter(folder__isnull=True).exists():
            context['items_without_folders_flag'] = True
        context['profile_id'] = self.request.user.id
        return context


class ProjectCreate(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    
    model = Project
    form_class = ProjectForm
    #fields = ['title', 'description', 'picture']
    template_name = 'projects/project_change.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

    def form_valid(self, form):
        form.instance.profile_id = self.request.user.id
        form.save()
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_edit_view', kwargs={'pk': self.object.pk})


class ProjectUpdate(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, UpdateView):
    
    model = Project
    form_class = ProjectForm
    #fields = ['title', 'description', 'picture']
    template_name = 'projects/project_change.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['project_owner']:
            raise PermissionDenied
        context['project_pk'] = self.object.pk
        context['form_action'] = 'project_update'
        context['form_pk'] = self.object.pk
        context['form_title'] = 'Update project'
        context['form_button'] = 'Save'
        context['delete_flag'] = True
        return context

    def get_success_url(self):
        return reverse_lazy('project_edit_view', kwargs={'pk': self.object.pk})


class ProjectDelete(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, DeleteView):
    
    model = Project
    template_name = 'projects/item_change_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['project_owner']:
            raise PermissionDenied
        context['project_pk'] = self.object.pk
        context['form_action'] = 'project_delete'
        context['form_pk'] = self.object.pk
        context['form_title'] = 'Delete project'
        context['form_button'] = 'Delete'
        return context

    def get_success_url(self):
        return reverse_lazy('project_owner_list')


class FolderCreate(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    
    model = Folder
    form_class = FolderForm
    template_name = 'projects/item_change_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['project_pk'] = self.kwargs['project_pk']
        context['form_action'] = 'folder_create'
        context['form_pk'] = self.kwargs['project_pk']
        context['form_title'] = 'Create project folder'
        context['form_button'] = 'Save'
        return context

    def form_valid(self, form):
        form.instance.project_id = self.kwargs['project_pk']
        form.save()
        return super().form_valid(form)

    def get_success_url(self):
        return '{}#project-overview'.format(reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.pk}))


class FolderUpdate(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, UpdateView):
    
    model = Folder
    form_class = FolderForm
    template_name = 'projects/folder_update.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['project_owner']:
            raise PermissionDenied
        context['project_pk'] = self.object.project_id
        context['form_action'] = 'folder_update'
        context['form_pk'] = self.object.id
        context['form_title'] = 'Update project folder'
        context['form_button'] = 'Save'
        context['delete_flag'] = True
        return context

    def get_success_url(self):
        return '{}#project-overview'.format(reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.pk}))


class FolderDelete(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, DeleteView):
    
    model = Folder
    template_name = 'projects/item_change_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['project_owner']:
            raise PermissionDenied
        context['project_pk'] = self.object.project_id
        context['form_action'] = 'folder_delete'
        context['form_pk'] = self.object.id
        context['form_title'] = 'Delete project folder'
        context['form_button'] = 'Delete'
        return context

    def get_success_url(self):
        return '{}#project-overview'.format(reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.pk}))


class ItemCreate(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    
    model = Item
    form_class = ItemForm
    template_name = 'projects/item_change_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['project_pk'] = self.kwargs['project_pk']
        context['form_action'] = 'item_create'
        context['form_pk'] = self.kwargs['project_pk']
        context['form_title'] = 'Create project item'
        context['form_button'] = 'Save'
        return context

    def get_initial(self):
        return {'project_id': self.kwargs['project_pk']}

    def form_valid(self, form):
        form.instance.project_id = self.kwargs['project_pk']
        form.save()
        if settings.ETH_UPDATE_SYNC:
            add_item_for_ethereum_ropsten_address(
                form.instance.id,
                form.instance.project.profile.id,
            )
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.pk})


class ItemUpdate(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, UpdateView):
    
    model = Item
    form_class = ItemForm
    #fields = ['title', 'deadline', 'brief', 'folder']
    template_name = 'projects/item_update.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['project_owner']:
            raise PermissionDenied
        context['project_pk'] = self.object.project_id
        context['form_action'] = 'item_update'
        context['form_pk'] = self.object.id
        context['form_title'] = 'Update project item'
        context['form_button'] = 'Save'
        context['delete_flag'] = True
        return context

    def get_success_url(self):
        return '{}#project-overview'.format(reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.pk}))


class ItemDelete(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, DeleteView):
    
    model = Item
    template_name = 'projects/item_change_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['project_owner']:
            raise PermissionDenied
        context['project_pk'] = self.object.project_id
        context['form_action'] = 'item_delete'
        context['form_pk'] = self.object.id
        context['form_title'] = 'Delete project item'
        context['form_button'] = 'Delete'
        return context

    def get_success_url(self):
        return '{}#project-overview'.format(reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.pk}))


class ProjectEditView(LoginRequiredMixin, PermissionRequiredMixin, IsProjectOwnerMixin, DetailView):
    
    model = Project
    template_name = 'projects/project_edit_view.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['project_owner']:
            raise PermissionDenied
        context['edit_flag'] = True
        if self.object.project_items.filter(folder__isnull=True).exists():
            context['items_without_folders_flag'] = True
        context['project_end'] = self.object.project_items.aggregate(Max('deadline'))['deadline__max']
        context['open_positions'] = self.object.project_items.filter(supplier__isnull=True).count()
        return context


class ProjectOwnerList(LoginRequiredMixin, PermissionRequiredMixin, ListView):

    model = Project
    paginate_by = 50
    template_name = 'projects/project_list.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['project_url'] = 'project_edit_view'
        context['dashboard'] = True
        return context

    def get_queryset(self):
        return Project.objects.filter(profile=self.request.user)


class ItemInviteSupplierList(LoginRequiredMixin, PermissionRequiredMixin, IsItemOwnerMixin, ListView):

    model = Profile
    paginate_by = 50
    template_name = 'projects/invite_supplier_list.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['item_owner']:
            raise PermissionDenied
        return context


class ItemInviteSupplierConfirm(LoginRequiredMixin, PermissionRequiredMixin, IsItemOwnerMixin, CreateView):

    model = ItemSupplierApplication
    fields = []
    template_name = 'projects/item_invite_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['item_owner']:
            raise PermissionDenied
        context['form_action'] = 'item_invite_supplier_confirm'
        context['form_pk'] = self.kwargs['item_pk']
        context['form_title'] = 'Invite supplier'
        context['form_button'] = 'Invite'
        profile = Profile.objects.get(pk=self.kwargs['profile_pk'])
        context['profile'] = profile
        context['message'] = '{} {}'.format(profile.first_name, profile.last_name)
        return context

    def form_valid(self, form):
        form.instance.item_id = self.kwargs['item_pk']
        form.instance.profile_id = self.kwargs['profile_pk']
        form.instance.status = ItemSupplierApplication.INVITED
        form.save()
        send_item_supplier_invite_email(
            self.request,
            form.instance,
        )
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('item_supplier_management', kwargs={'pk': self.object.item.pk})


class ItemInviteSupplierCancel(LoginRequiredMixin, PermissionRequiredMixin, IsItemOwnerMixin, DeleteView):

    model = ItemSupplierApplication
    fields = []
    template_name = 'projects/item_invite_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['item_owner']:
            raise PermissionDenied
        context['form_action'] = 'item_invite_supplier_cancel'
        context['form_pk'] = self.kwargs['pk']
        context['form_title'] = 'Cancel supplier invite'
        context['form_button'] = 'Cancel Invite'
        context['profile'] = self.object.profile
        context['message'] = '{} {}'.format(self.object.profile.first_name, self.object.profile.last_name)
        return context

    def get_success_url(self):
        return reverse_lazy('item_supplier_management', kwargs={'pk': self.object.item.pk})


class ItemInviteAccept(LoginRequiredMixin, PermissionRequiredMixin, IsInvitee, UpdateView):

    model = Item
    fields = []
    template_name = 'projects/item_invite_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['invitee']:
            raise PermissionDenied
        context['form_action'] = 'item_invite_accept'
        context['form_pk'] = self.object.id
        context['form_title'] = 'Accept invitation'
        context['form_button'] = 'Accept'
        context['message'] = self.object.title
        return context

    def form_valid(self, form):
        form.instance.supplier_id = self.object.invited_supplier.profile_id
        form.save()
        send_item_owner_accepted_invite_email(self.request, form.instance)
        if settings.ETH_UPDATE_SYNC:
            set_supplier(self.object.id, form.instance.supplier_id)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_view', kwargs={'pk': self.object.project.pk})


class ItemInviteDecline(LoginRequiredMixin, PermissionRequiredMixin, IsInvitee, UpdateView):

    model = ItemSupplierApplication
    fields = ['comments']
    template_name = 'projects/item_invite_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['invitee']:
            raise PermissionDenied
        context['form_action'] = 'item_invite_decline'
        context['form_pk'] = self.kwargs['pk']
        context['form_title'] = 'Decline invitation'
        context['form_button'] = 'Decline'
        context['message'] = self.object.item.title
        return context

    def form_valid(self, form):
        form.instance.declined = True
        form.save()
        send_item_owner_declined_invite_email(self.request, form.instance)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_view', kwargs={'pk': self.object.item.project.pk})


class ItemSupplierApply(LoginRequiredMixin, PermissionRequiredMixin, CreateView):

    model = ItemSupplierApplication
    fields = []
    template_name = 'projects/item_invite_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['form_action'] = 'item_supplier_apply'
        context['form_pk'] = self.kwargs['pk']
        item = Item.objects.get(pk=self.kwargs['pk'])
        context['form_title'] = 'Item application'
        context['form_button'] = 'Apply'
        context['message'] = item.title
        return context

    def form_valid(self, form):
        form.instance.item_id = self.kwargs['pk']
        form.instance.profile_id = self.request.user.id
        form.instance.status = ItemSupplierApplication.APPLIED
        form.save()
        send_item_owner_supplier_applied_email(self.request, form.instance)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_view', kwargs={'pk': self.object.item.project.pk})


class ItemSupplierCancelApp(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):

    model = Item
    fields = []
    template_name = 'projects/item_invite_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        self.application = ItemSupplierApplication.objects.filter(
            item=self.object,
            profile_id=self.request.user.id,
            status=ItemSupplierApplication.APPLIED,
        )
        if not self.application:
            raise PermissionDenied
        self.application = self.application[0]
        self.project_pk = self.application.item.project.pk
        context['form_action'] = 'item_supplier_cancel_app'
        context['form_pk'] = self.application.item.id
        context['form_title'] = 'Cancel application'
        context['form_button'] = 'Cancel Application'
        context['message'] = self.application.item.title
        return context

    def form_valid(self, form):
        ItemSupplierApplication.objects.filter(
            item=self.object.id,
            profile_id=self.request.user.id,
            status=ItemSupplierApplication.APPLIED,
        ).delete()
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_view', kwargs={'pk': self.object.project.id})


class ItemApplicationAccept(LoginRequiredMixin, PermissionRequiredMixin, IsItemOwnerMixin, UpdateView):

    model = Item
    fields = []
    template_name = 'projects/item_invite_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['item_owner']:
            raise PermissionDenied
        application = ItemSupplierApplication.objects.get(
            pk=self.kwargs['application_pk'],
        )
        context['application_pk'] = self.kwargs['application_pk']
        context['form_action'] = 'item_application_accept'
        context['form_pk'] = self.object.id
        context['form_title'] = 'Accept application'
        context['form_button'] = 'Accept'
        context['message'] = '{} {}'.format(application.profile.first_name, application.profile.last_name)
        return context

    def form_valid(self, form):
        application = ItemSupplierApplication.objects.get(
            pk=self.kwargs['application_pk'],
        )
        form.instance.supplier_id = application.profile_id
        form.save()
        send_item_supplier_application_accepted_email(self.request, application)
        if settings.ETH_UPDATE_SYNC:
            set_supplier(self.object.id, form.instance.supplier_id)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.pk})


class ItemSupplierManagement(LoginRequiredMixin, PermissionRequiredMixin, IsItemOwnerMixin, DetailView):

    model = Item
    fields = []
    template_name = 'projects/item_supplier_management.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['item_owner']:
            raise PermissionDenied
        if self.object.supplier:
            raise PermissionDenied

        context['invites'] = ItemSupplierApplication.objects.filter(
            item=self.object,
            status=ItemSupplierApplication.INVITED,
            declined=False,
        )

        context['applications'] = ItemSupplierApplication.objects.filter(
            item=self.object,
            status=ItemSupplierApplication.APPLIED,
            declined=False,
        )

        return context

    def get_success_url(self):
        return reverse_lazy('project_edit_view', kwargs={'pk': self.object.project.id})



class ItemWorkSubmit(LoginRequiredMixin, PermissionRequiredMixin, IsItemSupplierMixin, CreateView):
    
    model = ItemWork
    fields = ['picture']
    template_name = 'projects/item_work_change.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['item_supplier']:
            raise PermissionDenied
        context['form_action'] = 'item_work_submit'
        context['form_pk'] = self.kwargs['item_pk']
        item = Item.objects.get(pk=self.kwargs['item_pk'])
        context['project_pk'] = item.project.id
        context['form_title'] = 'Item submit work'
        context['form_button'] = 'Submit'
        context['message'] = '<p>{}</p><p>{}/{}</p>'.format(item.title, item.itemwork_set.all().count(), item.amends)
        return context

    def form_valid(self, form):
        form.instance.item_id = self.kwargs['item_pk']
        form.instance.save()
        if form.instance.picture.file.name.split('.')[1] == 'pdf':
            pdf_image = convert_from_path(form.instance.picture.file.name)[0]
            pdf_image_io = BytesIO()
            pdf_image.save(pdf_image_io, format='JPEG')
            pdf_file_name = 'pdf_image_' + str(form.instance.id) + '.jpeg'
            form.instance.pdf_image.delete(save=False)  
            form.instance.pdf_image.save(pdf_file_name,content=ContentFile(pdf_image_io.getvalue()),save=False)
            form.instance.save()
            result, design_hash = generate_and_check_picture_hash(form.instance.pdf_image.url, self.kwargs['item_pk'])
        else:
            result, design_hash = generate_and_check_picture_hash(form.instance.picture.url, self.kwargs['item_pk'])
        if not result:
            form.instance.delete()
            form.add_error('picture', 'A design with this hash already exists')
            return self.form_invalid(form)
        form.instance.picture_hash = design_hash
        form.instance.save()
        send_item_owner_work_submitted_email(self.request, form.instance.item)
        if settings.ETH_UPDATE_SYNC:
            design_url = settings.BASE_IMAGE_URL + form.instance.picture.url
            design_hash = get_image_hash(design_url)
            form.instance.picture_hash = design_hash
            form.instance.save()
            add_design(
                form.instance.item.id, 
                form.instance.id, 
                design_hash,
            )
        if form.instance.item.approved:
            form.instance.approved = True
            form.instance.save()
            if settings.ETH_UPDATE_SYNC:
                approve_item(form.instance.item.id)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_view', kwargs={'pk': self.object.item.project.pk})


class ItemWorkCancel(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):

    model = ItemWork
    template_name = 'projects/item_work_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.object.item.supplier.id != self.request.user.id:
            raise PermissionDenied
        context['form_action'] = 'item_work_cancel'
        context['form_pk'] = self.kwargs['pk']
        context['form_title'] = 'Item submit work'
        context['form_button'] = 'Cancel Submission'
        context['message'] = '<p>{}</p><p>{}/{}</p>'.format(self.object.item.title, self.object.item.itemwork_set.all().count(), self.object.item.amends)
        return context

    def get_success_url(self):
        return reverse_lazy('project_view', kwargs={'pk': self.object.item.project.pk})


class ItemWorkFeedback(LoginRequiredMixin, PermissionRequiredMixin, IsItemOwnerMixin, UpdateView):
    
    model = ItemWork
    fields = ['approved', 'dimensions_approved', 'resolution_approved', 'file_format_approved', 'feedback']
    template_name = 'projects/item_work_modal.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if not context['item_owner']:
            raise PermissionDenied
        context['form_action'] = 'item_work_feedback'
        context['form_pk'] = self.kwargs['pk']
        context['form_title'] = 'Item work feedback'
        context['form_button'] = 'Save'
        context['picture'] = self.object.picture
        return context

    def form_valid(self, form):
        if form.instance.approved:
            send_item_supplier_approval_email(self.request, self.object.item)
            if settings.ETH_UPDATE_SYNC:
                approve_item(form.instance.item.id)
        else:
            send_item_supplier_feedback_email(self.request, self.object.item)
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_edit_view', kwargs={'pk': self.object.item.project.pk})


@require_http_methods(["POST"])
@csrf_exempt
def item_approval_seen_by_supplier(request, pk):
    item = Item.objects.get(pk=pk)
    if item.supplier_id != request.user.id:
        return HttpResponse(status=403)
    item.approval_seen_by_supplier = True
    item.save()
    return JsonResponse({'success':'true'})


@require_http_methods(["POST"])
@csrf_exempt
def item_approval_seen_by_owner(request, pk):
    item = Item.objects.get(pk=pk)
    if item.project.profile_id != request.user.id:
        return HttpResponse(status=403)
    item.approval_seen_by_owner = True
    item.save()
    return JsonResponse({'success':'true'})


@require_http_methods(["POST"])
@csrf_exempt
def add_item_eth_tx(request):
    item_id = request.POST['item_id']
    tx_code = request.POST['tx_code']
    item_eth_tx = ItemEthTx()
    item_eth_tx.item_id = item_id
    item_eth_tx.tx_code = tx_code
    item_eth_tx.save()

    return HttpResponse(status=200)


class ItemWorkEthOwnership(LoginRequiredMixin, PermissionRequiredMixin, DetailView):
    model = ItemWork
    fields = []
    template_name = 'projects/item_work_eth_ownership.html'
    permission_required = 'projects.can_access'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.object.item.approved:
            design_owner = self.object.item.project.profile
        else:
            design_owner = self.object.item.supplier
        context['owner_address'] = ProfileItemEthAdd.objects.get(item=self.object.item, profile=design_owner).address
        context['company'] = design_owner.company
        if self.object.pdf_image:
            context['picture'] = self.object.pdf_image
        else:
            context['picture'] = self.object.picture
        context['picture_hash'] = self.object.picture_hash
        return context








