from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLES = (
        ('admin', 'Admin'),
        ('regular', 'Regular User'),
        ('guest', 'Guest'),
    )
    
    role = models.CharField(max_length=10, choices=ROLES, default='regular')
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)
    mfa_enabled = models.BooleanField(default=False)
    
    def is_admin_user(self):
        return self.role == 'admin'
    
    def is_regular_user(self):
        return self.role == 'regular'
    
    def is_guest_user(self):
        return self.role == 'guest'

    class Meta:
        db_table = 'users'