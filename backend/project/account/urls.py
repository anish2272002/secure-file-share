from django.urls import path
from .views import UserRegistrationView, UserLoginView, UserLogoutView, MFASetupView, MFAVerifyView, MFALoginVerifyView, CustomTokenRefreshView

urlpatterns = [
    path('register', UserRegistrationView.as_view(), name='register'),
    path('login', UserLoginView.as_view(), name='login'),
    path('logout', UserLogoutView.as_view(), name='logout'),
    path('token/refresh', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('mfa/setup', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/verify', MFAVerifyView.as_view(), name='mfa-verify'),
    path('mfa/verify-login', MFALoginVerifyView.as_view(), name='mfa-verify-login'),
] 