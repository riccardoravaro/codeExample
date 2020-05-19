from django.core.validators import FileExtensionValidator
from django.db import models
from django.conf import settings


from forgeplatform.profiles.models import Profile


def project_media_path(instance, filename):
    return 'projects/project_{0}/{1}'.format(instance.id, filename)


class Project(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE,)
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, max_length=600)
    picture = models.ImageField(upload_to='projects/', blank=True, null=True)
    curated = models.BooleanField(default=False)

    @property
    def all_items_approved(self):
        if (
            not self.item_set.all() or 
            self.item_set.filter(
                approved=False,
            ).exists()):
            return False
        return True

    def __str__(self):
        return self.title

    class Meta:
        permissions = (('can_access', 'Can access project pages',),)


class Folder(models.Model):

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_folders')
    title = models.CharField(max_length=50)
    colour = models.CharField(max_length=30)

    def __str__(self):
        return self.title

    class Meta(object):
        ordering = ['title']


class Item(models.Model):

    BMP = 'BMP'
    GIF = 'GIF'
    JPEG = 'JPEG'
    PDF = 'PDF'
    PSD = 'PSD'
    TIFF = 'TIFF'
    FILE_FORMAT_CHOICES = (
        (BMP, 'Windows BMP image (*.bmp)'),
        (GIF, 'GIF image (*.gif)'),
        (JPEG, 'JPEG image (*.jpeg, *.jpg)'),
        (PDF, 'Portable Document Format (*.pdf)'),
        (PSD, 'Photoshop Document (*.psd)'),
        (TIFF, 'TIFF image (*.tiff, *.tif)'),
    )

    A3 = 'A3'
    A4 = 'A4'
    A5 = 'A5'
    CUSTOM = 'CS'
    DIMENSIONS_CHOICES = (
        (A3, 'A3'),
        (A4, 'A4'),
        (A5, 'A5'),
        (CUSTOM, 'Custom'),
    )

    LOW = 'LO'
    MEDIUM = 'MD'
    HIGH = 'HI'
    RESOLUTION_CHOICES = (
        (LOW, 'Low'),
        (MEDIUM, 'Medium'),
        (HIGH, 'High'),
    )

    FIAT = 'FI'
    EQUITY = 'EQ'
    PRO_BONO = 'PB'
    ROYALTIES = 'RY'
    PAYMENT_CHOICES = (
        (FIAT, 'FIAT'),
        (EQUITY, 'Equity'),
        (PRO_BONO, 'Pro Bono'),
        (ROYALTIES, 'Royalties'),
    )

    JUNIOR = 'JN'
    MID_LEVEL = 'ML'
    SENIOR = 'SN'
    SUPPLIER_LEVEL_CHOICES = (
        (JUNIOR, 'Junior'),
        (MID_LEVEL, 'Mid Level'),
        (SENIOR, 'Senior'),
    )

    DESIGNER = 'DS'
    DIGITAL_DESIGNER = 'DD'
    UXUI_DESIGNER = 'UX'
    CM_DESIGNER = 'CM'
    DESIGN_ENG = 'DE'
    SUPPLIER_ROLE_CHOICES = (
        (DESIGNER, 'Designer'),
        (DIGITAL_DESIGNER, 'Digital Designer'),
        (UXUI_DESIGNER, 'UX/UI Designer'),
        (CM_DESIGNER, 'Colour Material Designer'),
        (DESIGN_ENG, 'Design Engineer'),
    )

    CURRENCY_CHOICES = (
        ('EUR', 'EUR - Euro'),
        ('GBP', 'GBP - Great British Pound'),
        ('USD', 'USD - US Dollar'),
        ('YEN', 'YEN - Japanese Yen'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_items')
    title = models.CharField(max_length=50)
    brief = models.TextField(max_length=600)
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, blank=True, null=True)
    kick_off = models.DateField()
    deadline = models.DateField()
    supplier = models.ForeignKey(Profile, on_delete=models.SET_NULL, blank=True, null=True)
    dimensions = models.CharField(
        max_length=2,
        choices=DIMENSIONS_CHOICES,
    )
    resolution = models.CharField(
        max_length=2,
        choices=RESOLUTION_CHOICES,
    )
    file_format = models.CharField(
        max_length=5,
        choices=FILE_FORMAT_CHOICES,
    )
    payment_method = models.CharField(
        max_length=2,
        choices=PAYMENT_CHOICES,
    )
    supplier_role = models.CharField(
        max_length=2,
        choices=SUPPLIER_ROLE_CHOICES,
    )
    supplier_level = models.CharField(
        max_length=2,
        choices=SUPPLIER_LEVEL_CHOICES,
    )
    amends = models.IntegerField(default=settings.WORK_SUBMISSION_LIMIT)
    approval_seen_by_owner = models.BooleanField(default=False)
    approval_seen_by_supplier = models.BooleanField(default=False)
    admin_approval = models.BooleanField(default=True)
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        blank=True,
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    


    @property
    def work_submission_count(self):
        return self.itemwork_set.count()

    @property
    def latest_work_submission(self):
        if not self.itemwork_set.all():
            return False
        return self.itemwork_set.latest('time_submitted')

    @property
    def approved(self):
        if self.work_submission_count == self.amends:
            return True
        if (
            self.latest_work_submission and
            self.latest_work_submission.approved == True
        ):
            return True
        return False

    @property
    def awaiting_work_submission(self):
        if (self.supplier and
            not self.approved and
            (
                not self.latest_work_submission or 
                self.latest_work_submission.approved == False
            )
        ):
            return True
        return False
        
    @property
    def awaiting_work_feedback(self):
        if (
            self.supplier and
            not self.approved and
            (
                self.latest_work_submission and 
                self.latest_work_submission.approved == None
            )
        ):
            return True
        return False

    @property
    def applied_suppliers_list(self):
        return self.itemsupplierapplication_set.filter(
            status=ItemSupplierApplication.APPLIED,
            declined=False,
        ).values_list('profile_id', flat=True)

    @property
    def invited_supplier(self):
        supplier = self.itemsupplierapplication_set.filter(
            status=ItemSupplierApplication.INVITED,
            declined=False,
        )
        if supplier:
            return supplier[0]
        return False

    @property
    def in_blockchain_add_item(self):
        if ItemEthTx.objects.filter(
            item=self,
            activity=ItemEthTx.ADD_ITEM,
        ).exists():
            return True
        return False

    @property
    def in_blockchain_set_supplier(self):
        if ItemEthTx.objects.filter(
            item=self,
            activity=ItemEthTx.SET_SUPPLIER,
        ).exists():
            return True
        return False

    @property
    def in_blockchain_approved(self):
        if ItemEthTx.objects.filter(
            item=self,
            activity=ItemEthTx.APPROVE_ITEM,
        ).exists():
            return True
        return False

    @property
    def in_blockchain_all_designs(self):
        if not self.itemwork_set.all().exists():
            return False
        for work in self.itemwork_set.all():
            if not work.in_blockchain:
                return False
        return True

    def __str__(self):
        return self.title

    class Meta(object):
        ordering = ['-folder', 'title']


class ItemSupplierApplication(models.Model):

    APPLIED = 'AP'
    INVITED = 'IN'
    APPLICATION_CHOICES = (
        (APPLIED, 'Applied'),
        (INVITED, 'Invited'),
    )

    item = models.ForeignKey(Item, on_delete=models.CASCADE,)
    profile =  models.ForeignKey(Profile, on_delete=models.CASCADE,)
    status = models.CharField(
        max_length=2,
        choices=APPLICATION_CHOICES,
    )
    declined = models.BooleanField(default=False)
    comments = models.TextField(blank=True)


class ItemWork(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE,)
    picture = models.FileField(
        upload_to=project_media_path,
         validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif'])],
    )
    time_submitted = models.DateTimeField(auto_now_add=True)
    feedback = models.TextField(blank=True)
    approved = models.NullBooleanField(null=True)
    dimensions_approved = models.NullBooleanField(null=True)
    resolution_approved = models.NullBooleanField(null=True)
    file_format_approved = models.NullBooleanField(null=True)
    picture_hash = models.CharField(max_length=50, blank=True)
    pdf_image = models.ImageField(
        upload_to=project_media_path,
        blank=True,
        null=True,
    )

    class Meta(object):
        ordering = ['time_submitted']

    @property
    def in_blockchain(self):
        if ItemEthTx.objects.filter(
            item_work=self,
            activity=ItemEthTx.ADD_DESIGN,
        ).exists():
            return True
        return False


class ItemEthTx(models.Model):

    ADD_ITEM = 'AD'
    SET_SUPPLIER = 'SS'
    ADD_DESIGN = 'DE'
    APPROVE_ITEM = 'AP'

    ACTIVITY_CHOICES = (
        (ADD_ITEM, 'Add item'),
        (SET_SUPPLIER, 'Set supplier'),
        (ADD_DESIGN, 'Add design'),
        (APPROVE_ITEM, 'Approve item'),
    )

    item = models.ForeignKey(Item, on_delete=models.CASCADE,)
    tx_code =  models.CharField(max_length=100)
    activity = models.CharField(
        max_length=2,
        choices=ACTIVITY_CHOICES,
    )
    item_work = models.ForeignKey(
        ItemWork,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )


class ProfileItemEthAdd(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE,)
    item = models.ForeignKey(Item, on_delete=models.CASCADE,)
    address = models.CharField(max_length=42)

    @property
    def is_supplier(self):
        if Item.objects.filter(id=self.item.id, supplier=self.profile).exists():
            return True
        return False

    class Meta:
        unique_together = (('profile', 'item'),)
