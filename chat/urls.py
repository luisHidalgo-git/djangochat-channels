from django.urls import path
from . import views 

urlpatterns = [
     path('chat/<str:room_name>/', views.chat_room, name='chat'),
     path('download/<int:submission_id>/', views.download_submission, name='download_submission'),
]