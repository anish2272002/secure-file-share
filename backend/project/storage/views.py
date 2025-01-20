from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from .models import EncryptedFile, FileShare, ShareableLink
from .serializers import EncryptedFileSerializer, FileShareSerializer, FileShareDetailsSerializer, ShareableLinkSerializer
from account.authentication import CustomTokenAuthentication
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
import mimetypes
import base64
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()

class UserTypePermission:
    def has_permission(self, request, allowed_types):
        return request.user.role in allowed_types

class FileUploadView(APIView):
    parser_classes = (MultiPartParser,)
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomTokenAuthentication]
    def post(self, request):
        # Check if user has permission to upload
        if request.user.role == 'guest':
            return Response(
                {'error': 'Guest users cannot upload files'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Validate required fields
            required_fields = ['file', 'encrypted_key', 'file_name', 'file_type', 'file_size']
            for field in required_fields:
                if field not in request.data:
                    return Response(
                        {'error': f'Missing required field: {field}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            file = request.FILES['file']
            encrypted_key = request.FILES['encrypted_key']
            
            # Create encrypted file record
            encrypted_file = EncryptedFile.objects.create(
                user=request.user,
                file_name=request.data['file_name'],
                encrypted_file=file,
                encryption_key=encrypted_key.read(),
                file_type=request.data['file_type'],
                file_size=request.data['file_size']
            )

            serializer = EncryptedFileSerializer(encrypted_file)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )

        except KeyError as e:
            return Response(
                {'error': f'Missing field: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class FileDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomTokenAuthentication]
    def get(self, request, file_id):
        try:
            file = EncryptedFile.objects.get(id=file_id)
            
            # Check if user has access to the file
            if not file.can_access(request.user):
                return Response(
                    {'error': 'You do not have permission to access this file'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            if not file.encrypted_file:
                return Response(
                    {'error': 'File not found on server'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            try:
                # Read the file content
                file_content = file.encrypted_file.read()
                
                # Ensure encryption_key is bytes
                encryption_key = file.encryption_key
                if not isinstance(encryption_key, bytes):
                    encryption_key = bytes(encryption_key)
                
                # Get the IV and encrypted data (first 12 bytes are IV)
                iv = file_content[:12]
                encrypted_data = file_content[12:]
                
                # Create response with IV prepended to encrypted data
                response_data = iv + encrypted_data
                
                # Base64 encode the encryption key
                encrypted_key_b64 = base64.b64encode(encryption_key).decode('utf-8')
                
                response = HttpResponse(
                    content=response_data,
                    content_type=str(file.file_type)
                )
                
                # Set headers
                response['Content-Disposition'] = f'attachment; filename="{file.file_name}"'
                response['Content-Length'] = str(len(response_data))
                response['Encrypted-Key'] = encrypted_key_b64
                
                # CORS headers
                response['Access-Control-Expose-Headers'] = ', '.join([
                    'Content-Disposition',
                    'Content-Length',
                    'Content-Type',
                    'Encrypted-Key',
                    'Original-Type'
                ])
                
                return response
            
            except EncryptedFile.DoesNotExist:
                return Response(
                    {'error': 'File not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            except Exception as e:
                return Response(
                    {'error': f'Error reading file: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except EncryptedFile.DoesNotExist:
            return Response(
                {'error': 'File not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class FileListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomTokenAuthentication]
    def get(self, request):
        try:
            # First, let's handle the case where user type methods might not exist
            user_type = getattr(request.user, 'role', None)

            if user_type == 'admin':
                files = EncryptedFile.objects.all().distinct()
            elif user_type == 'regular':
                # Use Q objects for OR condition without union
                files = EncryptedFile.objects.filter(
                    Q(user=request.user) | 
                    Q(is_shared=True, shares__shared_with=request.user)
                ).distinct()
            else:  # guest or undefined
                files = EncryptedFile.objects.filter(
                    is_shared=True,
                    shares__shared_with=request.user
                ).distinct()
            # Apply ordering after the query is complete
            files = files.order_by('-uploaded_at')

            serializer = EncryptedFileSerializer(files, many=True)
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': 'An error occurred while fetching files'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FileShareView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomTokenAuthentication]

    def post(self, request, file_id):
        try:
            file = EncryptedFile.objects.get(id=file_id)
            serializer = FileShareSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                shared_with = User.objects.get(email=serializer.validated_data['shared_with_email'])
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create share
            share = file.share_with_user(
                user=shared_with,
                permission=serializer.validated_data['permission'],
            )

            file.is_shared = True
            file.save()

            return Response(
                FileShareDetailsSerializer(share).data,
                status=status.HTTP_201_CREATED
            )

        except EncryptedFile.DoesNotExist:
            return Response(
                {'error': 'File not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request, file_id):
        try:
            file = EncryptedFile.objects.get(id=file_id)
            shares = file.shares.all()
            return Response(
                FileShareDetailsSerializer(shares, many=True).data
            )
        except EncryptedFile.DoesNotExist:
            return Response(
                {'error': 'File not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class CreateShareableLinkView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomTokenAuthentication]

    def post(self, request, file_id):
        try:
            file = EncryptedFile.objects.get(id=file_id)
            expiration_hours = request.data.get('expiration_hours', 24)
            permission = request.data.get('permission', 'view')

            shareable_link = file.create_shareable_link(
                user=request.user,
                expiration_hours=expiration_hours,
                permission=permission
            )

            serializer = ShareableLinkSerializer(
                shareable_link, 
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except EncryptedFile.DoesNotExist:
            return Response(
                {'error': 'File not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ShareableLinkAccessView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomTokenAuthentication]

    def get(self, request, token):
        try:
            link = get_object_or_404(ShareableLink, token=token)
            
            if not link.is_valid():
                return Response(
                    {'error': 'This link has expired or has been used'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get the file data
            file = link.file
            share = file.share_with_user(request.user, link.permission)

            file.is_shared = True
            file.save()

            link.is_used = True
            link.save()
            return Response(
                FileShareDetailsSerializer(share).data,
                status=status.HTTP_201_CREATED
            )

        except (ValueError, ShareableLink.DoesNotExist):
            return Response(
                {'error': 'Invalid or expired link'}, 
                status=status.HTTP_404_NOT_FOUND
            )