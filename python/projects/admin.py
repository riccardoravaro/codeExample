from django.contrib import admin
from .models import (
    Project,
    Folder,
    Item,
    ItemSupplierApplication,
    ItemWork,
    ItemEthTx,
    ProfileItemEthAdd,
)

class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'profile_id', 'curated',)


class FolderAdmin(admin.ModelAdmin):
    list_display = ('id', 'project_id', 'title',)


class ItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'project_id', 'title', 'supplier_id', 'approved')


class ItemWorkAdmin(admin.ModelAdmin):
    list_display = ('id', 'item_id', 'approved', 'picture_hash')
    search_fields = ['picture_hash']


class ItemEthTxAdmin(admin.ModelAdmin):
    list_display = ('id', 'item_id', 'item_work_id', 'activity', 'tx_code')


class ProfileItemEthAddAdmin(admin.ModelAdmin):
    list_display = ('id', 'item_id', 'profile_id', 'profile_details_for_admin', 'is_supplier', 'address')
    search_fields = ['address']

    def profile_details_for_admin(self, obj):
        return "{} | {} {}".format(
            obj.profile.username,
            obj.profile.first_name,
            obj.profile.last_name,
        )


class ItemSupplierApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'item_id', 'profile_id', 'status', 'declined')




# Register your models here.
admin.site.register(Project, ProjectAdmin)
admin.site.register(Folder, FolderAdmin)
admin.site.register(Item, ItemAdmin)
admin.site.register(ItemWork, ItemWorkAdmin)
admin.site.register(ItemEthTx, ItemEthTxAdmin)
admin.site.register(ProfileItemEthAdd, ProfileItemEthAddAdmin)
admin.site.register(ItemSupplierApplication, ItemSupplierApplicationAdmin)