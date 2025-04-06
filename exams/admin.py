from django.contrib import admin
from .models import Exam, Question, Choice, ExamSubmission, Answer

admin.site.register(Exam)
admin.site.register(Question)
admin.site.register(Choice)
admin.site.register(ExamSubmission)
admin.site.register(Answer)