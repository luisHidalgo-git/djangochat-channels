from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.CourseList.as_view(), name='course-list'),
    path('courses/<int:pk>/', views.CourseDetail.as_view(), name='course-detail'),
    path('assignments/', views.AssignmentList.as_view(), name='assignment-list'),
    path('assignments/<int:pk>/', views.AssignmentDetail.as_view(), name='assignment-detail'),
    path('submissions/', views.SubmissionList.as_view(), name='submission-list'),
    path('submissions/<int:pk>/', views.SubmissionDetail.as_view(), name='submission-detail'),
]