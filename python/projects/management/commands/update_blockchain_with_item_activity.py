import datetime

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from forgeplatform.projects.models import Item, ItemWork, ItemEthTx
from forgeplatform.projects.utils import (
    add_item_for_ethereum_ropsten_address, 
    set_supplier,
    add_design,
    get_image_hash,
    approve_item,
    send_item_owner_approval_email,
)


class Command(BaseCommand):
    help = 'Adds the following to the blockchain: item, supplier, design, item approval.'

    #def add_arguments(self, parser):
    #    parser.add_argument('poll_id', nargs='+', type=int)

    def handle(self, *args, **options):
        
        print(datetime.datetime.now().strftime("%b %d %Y %H:%M:%S"), "START")
        all_items = Item.objects.all()
        added_item_ids = ItemEthTx.objects.filter(activity=ItemEthTx.ADD_ITEM).values_list('item__id', flat=True).distinct()
        items_not_added = all_items.exclude(id__in=added_item_ids)
        for item in items_not_added:
            try:
                add_item_for_ethereum_ropsten_address(
                item.id,
                item.project.profile.id,
                )
                print('item', item.id, 'added to blockchain')
            except Exception as e:
                print('item', item.id, 'ERROR adding', e, datetime.datetime.now().strftime("%b %d %Y %H:%M:%S"))

        added_items_with_supplier = ItemEthTx.objects.filter(
            activity=ItemEthTx.ADD_ITEM,
            item__supplier__isnull=False,
        ).distinct()
        supplier_set_item_ids = ItemEthTx.objects.filter(activity=ItemEthTx.SET_SUPPLIER).values_list('item__id', flat=True).distinct()
        items_tx_supplier_set_missing = added_items_with_supplier.exclude(item_id__in=supplier_set_item_ids)

        for tx in items_tx_supplier_set_missing:
            try:
                set_supplier(
                    tx.item.id,
                    tx.item.supplier.id,
                )
                print('item', tx.item.id, 'supplier added to blockchain')
            except Exception as e:
                print('item', tx.item.id, 'ERROR adding supplier', e, datetime.datetime.now().strftime("%b %d %Y %H:%M:%S"))

        added_item_work_ids = ItemEthTx.objects.filter(
            activity=ItemEthTx.ADD_DESIGN,
        ).values_list('item_work__id', flat=True).distinct()

        submitted_work_design_not_added = ItemWork.objects.all().exclude(id__in=added_item_work_ids)

        for work in submitted_work_design_not_added:
            try:
                if not work.item.in_blockchain_set_supplier:
                    continue

                if not work.picture_hash:
                    design_url = settings.BASE_IMAGE_URL + work.picture.url
                    #design_url = 'http://ec2-18-130-52-112.eu-west-2.compute.amazonaws.com/media/projects/project_None/robson.jpg'
                    design_hash = get_image_hash(design_url)
                    work.picture_hash = design_hash
                    work.save()
                add_design(
                    work.item.id, 
                    work.id, 
                    work.picture_hash,
                )

                print('item', work.item.id, 'design', work.id, 'added to blockchain')
            except Exception as e:
                print('item', work.item.id, 'design', work.id, 'ERROR adding to blockchain', e, datetime.datetime.now().strftime("%b %d %Y %H:%M:%S"))

        items_approved_in_blockchain = ItemEthTx.objects.filter(
            activity=ItemEthTx.APPROVE_ITEM,
        ).values_list('item_id', flat=True).distinct()

        approved_work_not_in_blockchain = ItemWork.objects.filter(approved=True, item__admin_approval=True).exclude(item_id__in=items_approved_in_blockchain)

        for work in approved_work_not_in_blockchain:

            if not work.item.in_blockchain_all_designs:
                continue

            try:
                approve_item(
                work.item.id, 
                )

                print('item', work.item.id, 'approved in blockchain')
                send_item_owner_approval_email(work.item)
            except Exception as e:
                print('item', work.item.id, 'ERROR approving in blockchain', e, datetime.datetime.now().strftime("%b %d %Y %H:%M:%S"))


        print(datetime.datetime.now().strftime("%b %d %Y %H:%M:%S"), "END")