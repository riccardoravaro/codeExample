# Generated by Django 2.0.5 on 2018-05-08 09:35

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import forgeplatform.projects.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AcceptanceCriteria',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('criterion', models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='Deliverable',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=50)),
                ('description', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=50)),
                ('description', models.TextField(blank=True)),
                ('picture', models.ImageField(blank=True, null=True, upload_to=forgeplatform.projects.models.project_media_path)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='WorkPackage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=50)),
                ('aims', models.TextField()),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Project')),
            ],
        ),
        migrations.AddField(
            model_name='deliverable',
            name='work_package',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.WorkPackage'),
        ),
        migrations.AddField(
            model_name='acceptancecriteria',
            name='deliverable',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Deliverable'),
        ),
    ]
