# Generated by Django 5.1.4 on 2025-01-14 19:03

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('storage', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='encryptedfile',
            name='updated_at',
        ),
    ]
