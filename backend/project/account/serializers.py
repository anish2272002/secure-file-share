from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework import serializers
from .models import User
import pyotp

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'regular')
        )
        if not user.mfa_secret:
            user.mfa_secret = pyotp.random_base32()
            user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class MFAVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)

class MFALoginVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)
    username = serializers.CharField()

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Code must contain only digits")
        return value
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['mfaEnabled'] = user.mfa_enabled
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['id'] = user.id

        return token

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Here you can add additional claims if needed
        # For example, you can fetch the user from the refresh token
        refresh = self.get_token(attrs['refresh'])
        user = refresh.user  # Get the user associated with the refresh token

        # Add custom claims to the access token
        data['mfaEnabled'] = user.mfa_enabled
        data['username'] = user.username
        data['email'] = user.email
        data['role'] = user.role
        data['id'] = user.id

        return data