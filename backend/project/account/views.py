from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .authentication import CustomTokenAuthentication
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    MFAVerifySerializer,
    MFALoginVerifySerializer,
    CustomTokenObtainPairSerializer,
    CustomTokenRefreshSerializer,
);
from rest_framework_simplejwt.views import TokenRefreshView
import pyotp
from .models import User

class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer

class UserRegistrationView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            serializer = CustomTokenObtainPairSerializer.get_token(user)
            refresh = str(serializer)
            access = str(serializer.access_token)
            return Response({
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'mfaEnabled': user.mfa_enabled,
                },
                'refresh': refresh,
                'access': access,
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )

            if user is None:
                return Response({'error': 'Invalid credentials'}, 
                              status=status.HTTP_400_BAD_REQUEST)

            if user.mfa_enabled:
                return Response({
                    'mfaRequired': True,
                    'username': user.username,
                }, status=status.HTTP_200_OK)

            serializer = CustomTokenObtainPairSerializer.get_token(user)
            refresh = str(serializer)
            access = str(serializer.access_token)

            return Response({
                'user': {
                    'mfaEnabled': user.mfa_enabled,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'id': user.id,
                },
                'refresh': refresh,
                'access': access,
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class MFASetupView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Generate a random secret key
        secret = pyotp.random_base32()
        
        # Create the TOTP object
        totp = pyotp.TOTP(secret)
        
        # Generate the provisioning URI for QR code
        provisioning_uri = totp.provisioning_uri(
            name=request.user.email,
            issuer_name="SecureApp"
        )
        
        # Save the secret to user's profile
        request.user.mfa_secret = secret
        request.user.save()
        
        return Response({
            'secret': secret,
            'qrCode': provisioning_uri
        })

class MFAVerifyView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        code = serializer.validated_data['code']
        
        if not code:
            return Response(
                {'error': 'Verification code is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.user.mfa_secret:
            return Response(
                {'error': 'MFA not set up'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        totp = pyotp.TOTP(request.user.mfa_secret)
        
        if totp.verify(code):
            request.user.mfa_enabled = True
            request.user.save()
            return Response({'message': 'MFA enabled successfully'})
        
        return Response(
            {'error': 'Invalid verification code'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class MFALoginVerifyView(APIView):
    def post(self, request):
        serializer = MFALoginVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        code = serializer.validated_data['code']
        username = serializer.validated_data['username']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.mfa_enabled:
            return Response(
                {'error': 'MFA not enabled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        if not user.mfa_secret:
            return Response(
                {'error': 'MFA secret not set'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        totp = pyotp.TOTP(user.mfa_secret)
        
        if totp.verify(code):
            # Generate tokens
            serializer = CustomTokenObtainPairSerializer.get_token(user)
            refresh = str(serializer)
            access = str(serializer.access_token)
            return Response({
                'user': {
                    'mfaEnabled': user.mfa_enabled,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'id': user.id,
                },
                'refresh': refresh,
                'access': access,
            }, status=status.HTTP_200_OK)
        
        return Response(
            {'error': 'Invalid verification code'}, 
            status=status.HTTP_400_BAD_REQUEST
        )