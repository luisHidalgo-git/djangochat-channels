from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import FileResponse, Http404
from .models import AssignmentSubmission, Assignment

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

@login_required
def download_support_file(request, assignment_id):
    assignment = get_object_or_404(Assignment, id=assignment_id)
    
    if not assignment.support_file:
        raise Http404("No support file available")
    
    try:
        response = FileResponse(assignment.support_file)
        response['Content-Disposition'] = f'attachment; filename="{assignment.support_file_name}"'
        return response
    except Exception as e:
        raise Http404("File not found")