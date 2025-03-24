from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Message, AssignmentSubmission
from django.db.models import Q
from datetime import datetime
from django.utils import timezone
from django.core.cache import cache
from django.http import FileResponse, Http404
import os

@login_required
def chat_room(request, room_name):
    search_query = request.GET.get('search', '')
    message_type = request.GET.get('message_type', '')
    subject = request.GET.get('subject', '')
    status = request.GET.get('status', '')
    direction = request.GET.get('direction', '')
    
    users = User.objects.exclude(id=request.user.id)
    chats = Message.objects.filter(
        (Q(sender=request.user) & Q(receiver__username=room_name)) |
        (Q(receiver=request.user) & Q(sender__username=room_name))
    )

    if search_query:
        chats = chats.filter(Q(content__icontains=search_query))

    if message_type:
        chats = chats.filter(message_type=message_type)

    if subject and subject != 'all':
        chats = chats.filter(subject=subject)

    if status and status != 'all':
        chats = chats.filter(status=status)

    if direction:
        if direction == 'sent':
            chats = chats.filter(sender=request.user)
        elif direction == 'received':
            chats = chats.filter(receiver=request.user)

    chats = chats.order_by('timestamp')
    user_last_messages = []

    for user in users:
        last_message = Message.objects.filter(
            (Q(sender=request.user) & Q(receiver=user)) |
            (Q(receiver=request.user) & Q(sender=user))
        ).order_by('-timestamp').first()

        status = cache.get(f'user_status_{user.username}', 'offline')

        user_last_messages.append({
            'user': user,
            'last_message': last_message,
            'status': status
        })

    user_last_messages.sort(
        key=lambda x: x['last_message'].timestamp if x['last_message'] else timezone.make_aware(datetime.min),
        reverse=True
    )

    return render(request, 'chat.html', {
        'room_name': room_name,
        'chats': chats,
        'users': users,
        'user_last_messages': user_last_messages,
        'search_query': search_query,
        'message_type': message_type,
        'subject': subject,
        'status': status,
        'direction': direction
    })

@login_required
def download_submission(request, submission_id):
    submission = get_object_or_404(AssignmentSubmission, id=submission_id)
    
    # Check if user has permission to download
    if request.user != submission.student and request.user != submission.assignment.creator:
        raise Http404("No permission to access this file")
    
    try:
        response = FileResponse(submission.file)
        response['Content-Disposition'] = f'attachment; filename="{submission.file_name}"'
        return response
    except Exception as e:
        raise Http404("File not found")