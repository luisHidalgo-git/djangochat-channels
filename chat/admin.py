from django.contrib import admin
from .models import Message, Course, Assignment

admin.site.register(Message)
admin.site.register(Course)
admin.site.register(Assignment)