# Generated by Django 2.0.5 on 2018-07-19 13:55

import django.core.validators
from django.db import migrations, models
import forgeplatform.projects.models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0029_auto_20180719_1241'),
    ]

    operations = [
        migrations.AddField(
            model_name='itemwork',
            name='pdf_image',
            field=models.ImageField(blank=True, null=True, upload_to=forgeplatform.projects.models.project_media_path),
        ),
        migrations.AlterField(
            model_name='itemwork',
            name='picture',
            field=models.FileField(upload_to=forgeplatform.projects.models.project_media_path, validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif'])]),
        ),
    ]
