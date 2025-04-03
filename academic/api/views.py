from rest_framework import generics, permissions
from academic.models import Course, Assignment, AssignmentSubmission
from .serializers import CourseSerializer, AssignmentSerializer, SubmissionSerializer

class CourseList(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class CourseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

class AssignmentList(generics.ListCreateAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class AssignmentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class SubmissionList(generics.ListCreateAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Students can only see their own submissions
        # Teachers can see all submissions for their assignments
        if user.is_staff:
            return AssignmentSubmission.objects.all()
        return AssignmentSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

class SubmissionDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Students can only access their own submissions
        # Teachers can access all submissions
        if user.is_staff:
            return AssignmentSubmission.objects.all()
        return AssignmentSubmission.objects.filter(student=user)