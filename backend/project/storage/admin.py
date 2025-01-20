from django.contrib import admin
from .models import EncryptedFile, FileShare, ShareableLink
# Register your models here.
admin.site.register(EncryptedFile)
admin.site.register(FileShare)
admin.site.register(ShareableLink)