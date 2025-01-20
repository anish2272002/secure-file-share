from rest_framework import serializers
from .models import EncryptedFile, FileShare, ShareableLink
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class EncryptedFileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    shared_with = UserSerializer(many=True, read_only=True)
    class Meta:
        model = EncryptedFile
        fields = [
            'id',
            'file_name',
            'file_type',
            'file_size',
            'uploaded_at',
            'is_shared',
            'user',
            'shared_with'
        ]

class FileShareSerializer(serializers.ModelSerializer):
    shared_with_email = serializers.EmailField(write_only=True)
    permission = serializers.ChoiceField(choices=FileShare.PERMISSION_CHOICES)

    class Meta:
        model = FileShare
        fields = ['shared_with_email', 'permission']

class FileShareDetailsSerializer(serializers.ModelSerializer):
    shared_with = UserSerializer()
    file = EncryptedFileSerializer()
    
    class Meta:
        model = FileShare
        fields = ['id','file','shared_with', 'permission']

class ShareableLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareableLink
        fields = ['id', 'token', 'expires_at', 'is_used']
        read_only_fields = ['id', 'token', 'is_used']