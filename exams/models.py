from django.db import models
from django.conf import settings
import random

class Exam(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    total_points = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)
    questions_to_answer = models.IntegerField(default=0)  # Number of questions students should answer

    def get_random_questions(self):
        """Get a random subset of questions for a student."""
        all_questions = list(self.questions.all())
        num_questions = min(self.questions_to_answer, len(all_questions))
        return random.sample(all_questions, num_questions)

    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPES = [
        ('single', 'Single Choice'),
        ('multiple', 'Multiple Choice'),
    ]

    exam = models.ForeignKey(Exam, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES)
    points = models.IntegerField()
    order = models.IntegerField()

    def __str__(self):
        return f"Question {self.order} - {self.exam.title}"

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.TextField()
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class ExamSubmission(models.Model):
    exam = models.ForeignKey(Exam, related_name='submissions', on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    assigned_questions = models.ManyToManyField(Question, related_name='assigned_to')

    class Meta:
        unique_together = ['exam', 'student']

    def __str__(self):
        return f"{self.student.username}'s submission for {self.exam.title}"

class Answer(models.Model):
    submission = models.ForeignKey(ExamSubmission, related_name='answers', on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choices = models.ManyToManyField(Choice)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Answer for {self.question}"