# Generated by Django 2.0.5 on 2018-06-07 13:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0012_itemethtx'),
    ]

    operations = [
        migrations.AlterField(
            model_name='itemethtx',
            name='tx_code',
            field=models.CharField(max_length=100),
        ),
    ]