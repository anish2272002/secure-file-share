# Generated by Django 5.1.4 on 2025-01-17 03:13

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('storage', '0004_alter_encryptedfile_options'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FileShare',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('permission', models.CharField(choices=[('view', 'View Only'), ('download', 'View and Download')], default='view', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('share_token', models.UUIDField(default=uuid.uuid4, editable=False)),
                ('file', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shares', to='storage.encryptedfile')),
                ('shared_with', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_shares', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('file', 'shared_with')},
            },
        ),
    ]
