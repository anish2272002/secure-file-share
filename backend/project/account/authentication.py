from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt

User = get_user_model()

class CustomTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION')
        if not auth:
            return None  # No authentication provided

        try:
            # Split the token from the "Bearer" prefix
            prefix, token = auth.split(' ')
            if prefix != 'Bearer':
                raise AuthenticationFailed('Invalid token prefix')

            # Validate the token and get the user
            user = self.get_user_from_token(token)
            if user is None:
                raise AuthenticationFailed('Invalid token')

            return (user, None)  # Return the user and None for the auth

        except ValueError:
            raise AuthenticationFailed('Invalid token format')

    def get_user_from_token(self, token):
        try:
            # Decode the token (replace 'your_secret_key' with your actual secret key)
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            print(payload)
            user_id = payload.get('user_id')  # Adjust based on your token payload structure
            return User.objects.get(id=user_id)
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None  # Token is invalid or expired
        except User.DoesNotExist:
            return None  # User does not exist