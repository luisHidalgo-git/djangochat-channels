from django.db import models
from django.conf import settings
from django.utils import timezone

class Course(models.Model):
    SUBJECT_CHOICES = [
        ('programming', 'Programación'),
        ('math', 'Matemáticas'),
        ('english', 'Inglés'),
    ]

    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=20, choices=SUBJECT_CHOICES)
    description = models.TextField()
    room = models.CharField(max_length=50)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Assignment(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('submitted', 'Submitted'),
        ('late', 'Late'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    points = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_status_for_student(self, student):
        submission = self.submissions.filter(student=student).first()
        if submission:
            return submission.status
        return 'active'

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to='assignment_submissions/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=255)  # Aumentado de 50 a 255 caracteres
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Assignment.STATUS_CHOICES, default='submitted')

    class Meta:
        unique_together = ['assignment', 'student']

    def save(self, *args, **kwargs):
        if self.submitted_at > self.assignment.due_date:
            self.status = 'late'
        else:
            self.status = 'submitted'
        super().save(*args, **kwargs)

    def is_passing_grade(self):
        return self.grade >= 80 if self.grade is not None else False