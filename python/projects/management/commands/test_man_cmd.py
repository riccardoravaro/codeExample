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


    def handle(self, *args, **options):


        item = Item.objects.get(pk=10000031)
        send_item_owner_approval_email(item)