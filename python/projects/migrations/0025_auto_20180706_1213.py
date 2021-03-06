# Generated by Django 2.0.5 on 2018-07-06 12:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0024_auto_20180703_1220'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='admin_approval',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='item',
            name='currency',
            field=models.CharField(blank=True, choices=[('EUR', 'Euro'), ('GBP', 'Great British Pound'), ('USD', 'US Dollar'), ('YEN', 'Japanese Yen')], max_length=3),
        ),
        migrations.AddField(
            model_name='item',
            name='value',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
