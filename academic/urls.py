from django.urls import path
from . import views

urlpatterns = [
    path('download/<int:submission_id>/', views.download_submission, name='download_submission'),
]