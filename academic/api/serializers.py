from rest_framework import serializers
from django.contrib.auth.models import User
from academic.models import Course, Assignment, AssignmentSubmission

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class CourseSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'name', 'subject', 'description', 'room', 'creator', 'created_at']

class AssignmentSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'course', 'title', 'description', 'due_date', 
            'points', 'status', 'creator', 'created_at',
            'support_file', 'support_file_name', 'support_file_type'
        ]

class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'student', 'file', 'file_name',
            'file_type', 'submitted_at', 'grade', 'feedback', 'status'
        ]