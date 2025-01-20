from django.db import models
from django.contrib.auth import get_user_model
import uuid
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class ShareableLink(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('download', 'View and Download')
    ]
    file = models.ForeignKey('EncryptedFile', on_delete=models.CASCADE, related_name='shareable_links')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='view')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_links')

    def is_valid(self):
        return (
            not self.is_used and
            self.expires_at > timezone.now()
        )

    def mark_as_used(self):
        self.is_used = True
        self.save()

class FileShare(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('download', 'View and Download')
    ]

    file = models.ForeignKey('EncryptedFile', on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_shares')
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='view')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('file', 'shared_with')

class EncryptedFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField()
    encrypted_file = models.FileField(upload_to='encrypted_files/')
    encryption_key = models.BinaryField(editable=True)  # Store the encryption key as binary
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_shared = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.file_name} ({self.user.username})"
    
    def share_with_user(self, user, permission='view'):
    
        share, created = FileShare.objects.get_or_create(
            file=self,
            shared_with=user,
            defaults={
                'permission': permission,
            }
        )
        return share
    def create_shareable_link(self, user, expiration_hours=24, permission='view'):
        expires_at = timezone.now() + timedelta(hours=expiration_hours)
        return ShareableLink.objects.create(
            file=self,
            expires_at=expires_at,
            created_by=user,
            permission=permission
        )

    def can_access(self, user):
        if user.role == 'admin' or user == self.user:
            return 'download'
        
        share = self.shares.filter(shared_with=user).first()
        if share:
            return share.permission
            
        return None