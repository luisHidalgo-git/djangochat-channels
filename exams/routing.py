from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/exams/$', consumers.ExamConsumer.as_asgi()),
]