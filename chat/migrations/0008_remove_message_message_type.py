# Generated by Django 5.1.2 on 2025-03-09 04:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0007_message_message_type'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='message',
            name='message_type',
        ),
    ]
