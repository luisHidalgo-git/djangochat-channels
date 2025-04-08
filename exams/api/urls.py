from django.urls import path
from .views import ExamList, ExamDetail

urlpatterns = [
    path('exams/', ExamList.as_view(), name='exam-list'),
    path('exams/<int:pk>/', ExamDetail.as_view(), name='exam-detail'),
]
