from django.db import models
from django.conf import settings
from django.db.models import Count

class Message(models.Model):
    SENT = 'sent'  
    DELIVERED = 'delivered'  
    READ = 'read'  
    
    STATUS_CHOICES = [
        (SENT, 'Sent'),
        (DELIVERED, 'Delivered'),
        (READ, 'Read'),
    ]

    MESSAGE_TYPES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('image', 'Image'),
    ]

    SUBJECTS = [
        ('none', 'None'),
        ('programming', 'Programación'),
        ('math', 'Matemáticas'),
        ('english', 'Inglés'),
    ]
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=SENT)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='normal')
    subject = models.CharField(max_length=20, choices=SUBJECTS, default='none')
    image = models.ImageField(upload_to='chat_images/', null=True, blank=True)

    def __str__(self):
        return self.content

    @staticmethod
    def get_unread_count(user, other_user):
        return Message.objects.filter(
            sender=other_user,
            receiver=user,
            status__in=[Message.SENT, Message.DELIVERED]
        ).count()