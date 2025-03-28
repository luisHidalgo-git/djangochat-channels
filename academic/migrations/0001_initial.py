# Generated by Django 5.1.2 on 2025-03-26 01:53

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('subject', models.CharField(choices=[('programming', 'Programación'), ('math', 'Matemáticas'), ('english', 'Inglés')], max_length=20)),
                ('description', models.TextField()),
                ('room', models.CharField(max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Assignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('due_date', models.DateTimeField()),
                ('points', models.IntegerField()),
                ('status', models.CharField(choices=[('active', 'Active'), ('submitted', 'Submitted'), ('late', 'Late')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assignments', to='academic.course')),
            ],
        ),
        migrations.CreateModel(
            name='AssignmentSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='assignment_submissions/')),
                ('file_name', models.CharField(max_length=255)),
                ('file_type', models.CharField(max_length=50)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('grade', models.IntegerField(blank=True, null=True)),
                ('feedback', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('submitted', 'Submitted'), ('late', 'Late')], default='submitted', max_length=20)),
                ('assignment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='academic.assignment')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('assignment', 'student')},
            },
        ),
    ]
