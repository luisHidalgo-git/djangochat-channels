from django.urls import path
from .views import MessageList, MessageDetail

urlpatterns = [
    path('messages/', MessageList.as_view(), name='message-list'),
    path('messages/<int:pk>/', MessageDetail.as_view(), name='message-detail'),
]
