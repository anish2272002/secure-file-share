from django.urls import path
from .views import (
    FileUploadView, 
    FileDownloadView, 
    FileListView,
    FileShareView, 
    CreateShareableLinkView, 
    ShareableLinkAccessView
)

urlpatterns = [
    path('upload', FileUploadView.as_view(), name='upload'),
    path('download/<str:file_id>', FileDownloadView.as_view(), name='download'),
    path('files', FileListView.as_view(), name='files'),
    path('share/<str:file_id>', FileShareView.as_view(), name='share'),
    path('share/<str:file_id>/share-link', CreateShareableLinkView.as_view(), name='create-share-link'),
    path('share/link/<uuid:token>', ShareableLinkAccessView.as_view(), name='access-shared-file'),
]
