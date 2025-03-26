import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from .models import Course, Assignment, AssignmentSubmission
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.core.files.base import ContentFile
import base64
import mimetypes

class CourseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('courses', self.channel_name)
        await self.accept()
        await self.send_all_courses()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('courses', self.channel_name)

    async def send_all_courses(self):
        try:
            courses = await self.get_all_courses()
            await self.send(json.dumps({
                'action': 'courses_update',
                'courses': courses
            }))
        except Exception as e:
            print(f"Error sending courses: {str(e)}")

    @sync_to_async
    def get_all_courses(self):
        courses = []
        current_user = User.objects.get(username=self.scope['user'].username)
        
        for course in Course.objects.all().select_related('creator'):
            assignments = course.assignments.all().select_related('creator')
            assignments_data = []
            
            for assignment in assignments:
                # Filtrar las entregas según el usuario
                submissions = assignment.submissions.all().select_related('student')
                submissions_data = []
                
                for submission in submissions:
                    # Solo incluir la entrega si:
                    # 1. El usuario actual es el creador de la tarea
                    # 2. O el usuario actual es el estudiante que hizo la entrega
                    if assignment.creator == current_user or submission.student == current_user:
                        submissions_data.append({
                            'id': submission.id,
                            'student': {
                                'name': submission.student.username,
                                'avatar': f'https://ui-avatars.com/api/?name={submission.student.username}&size=64&background=random'
                            },
                            'file_name': submission.file_name,
                            'file_type': submission.file_type,
                            'submitted_at': submission.submitted_at.strftime('%Y-%m-%d %H:%M'),
                            'grade': submission.grade,
                            'feedback': submission.feedback,
                            'status': submission.status,
                            'is_passing': submission.is_passing_grade()
                        })

                # Obtener el estado específico para el usuario actual
                status = assignment.get_status_for_student(current_user)

                assignments_data.append({
                    'id': assignment.id,
                    'title': assignment.title,
                    'description': assignment.description,
                    'dueDate': assignment.due_date.strftime('%Y-%m-%d %H:%M'),
                    'points': assignment.points,
                    'status': status,
                    'creator': {
                        'name': assignment.creator.username,
                        'avatar': f'https://ui-avatars.com/api/?name={assignment.creator.username}&size=64&background=random'
                    },
                    'created_at': assignment.created_at.strftime('%Y-%m-%d'),
                    'submissions': submissions_data
                })

            courses.append({
                'id': course.id,
                'name': course.name,
                'subject': course.subject,
                'description': course.description,
                'room': course.room,
                'creator': {
                    'name': course.creator.username,
                    'avatar': f'https://ui-avatars.com/api/?name={course.creator.username}&size=64&background=random'
                },
                'created_at': course.created_at.strftime('%Y-%m-%d'),
                'assignments': assignments_data
            })
        return courses

    @sync_to_async
    def create_course(self, data):
        user = User.objects.get(username=data['creator']['name'])
        course = Course.objects.create(
            name=data['name'],
            subject=data['subject'],
            description=data['description'],
            room=data['room'],
            creator=user
        )
        return {
            'id': course.id,
            'name': course.name,
            'subject': course.subject,
            'description': course.description,
            'room': course.room,
            'creator': {
                'name': course.creator.username,
                'avatar': f'https://ui-avatars.com/api/?name={course.creator.username}&size=64&background=random'
            },
            'created_at': course.created_at.strftime('%Y-%m-%d'),
            'assignments': []
        }

    @sync_to_async
    def create_assignment(self, course_id, data):
        try:
            course = Course.objects.get(id=course_id)
            user = User.objects.get(username=data['creator']['name'])
            
            # Parse the date string correctly
            due_date = timezone.datetime.strptime(data['dueDate'], '%Y-%m-%dT%H:%M')
            
            assignment = Assignment.objects.create(
                course=course,
                title=data['title'],
                description=data['description'],
                due_date=due_date,
                points=int(data['points']),
                status='active',
                creator=user
            )
            
            return {
                'id': assignment.id,
                'title': assignment.title,
                'description': assignment.description,
                'dueDate': assignment.due_date.strftime('%Y-%m-%d %H:%M'),
                'points': assignment.points,
                'status': assignment.status,
                'creator': {
                    'name': assignment.creator.username,
                    'avatar': f'https://ui-avatars.com/api/?name={assignment.creator.username}&size=64&background=random'
                },
                'created_at': assignment.created_at.strftime('%Y-%m-%d')
            }
        except Exception as e:
            print(f"Error creating assignment: {str(e)}")
            return None

    @sync_to_async
    def submit_assignment(self, assignment_id, student_username, file_data):
        try:
            assignment = Assignment.objects.get(id=assignment_id)
            student = User.objects.get(username=student_username)
            
            # Extract file information from base64 data
            file_info, file_content = file_data.split(',', 1)
            content_type = file_info.split(';')[0].split(':')[1]
            
            # Get file extension from content type
            extension = mimetypes.guess_extension(content_type)
            if not extension:
                # Fallback extensions based on content type
                extension_map = {
                    'application/msword': '.doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                    'application/vnd.ms-excel': '.xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                    'application/vnd.ms-powerpoint': '.ppt',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
                    'application/pdf': '.pdf',
                    'image/jpeg': '.jpg',
                    'image/png': '.png'
                }
                extension = extension_map.get(content_type, '')
            
            file_name = f"{student.username}_{assignment.title}{extension}"
            
            # Convert base64 to file
            file_content = base64.b64decode(file_content)
            
            # Create or update submission
            submission, created = AssignmentSubmission.objects.get_or_create(
                assignment=assignment,
                student=student,
                defaults={
                    'file_name': file_name,
                    'file_type': content_type,
                    'submitted_at': timezone.now()
                }
            )

            # Si la submission ya existía, actualizar los campos
            if not created:
                submission.file_name = file_name
                submission.file_type = content_type
                submission.submitted_at = timezone.now()
                # Eliminar el archivo anterior si existe
                if submission.file:
                    try:
                        submission.file.delete(save=False)
                    except Exception as e:
                        print(f"Error deleting old file: {str(e)}")

            # Guardar el nuevo archivo
            submission.file.save(file_name, ContentFile(file_content), save=True)
            
            return {
                'id': submission.id,
                'student': {
                    'name': student.username,
                    'avatar': f'https://ui-avatars.com/api/?name={student.username}&size=64&background=random'
                },
                'file_name': submission.file_name,
                'file_type': submission.file_type,
                'submitted_at': submission.submitted_at.strftime('%Y-%m-%d %H:%M'),
                'grade': submission.grade,
                'feedback': submission.feedback,
                'status': submission.status,
                'is_passing': submission.is_passing_grade()
            }
        except Exception as e:
            print(f"Error submitting assignment: {str(e)}")
            return None

    @sync_to_async
    def grade_submission(self, submission_id, grade, feedback):
        try:
            submission = AssignmentSubmission.objects.get(id=submission_id)
            submission.grade = grade
            submission.feedback = feedback
            submission.save()
            
            return {
                'id': submission.id,
                'grade': submission.grade,
                'feedback': submission.feedback,
                'is_passing': submission.is_passing_grade()
            }
        except Exception as e:
            print(f"Error grading submission: {str(e)}")
            return None

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'request_courses':
            await self.send_all_courses()
        
        elif action == 'new_course':
            course = await self.create_course(data['course'])
            await self.channel_layer.group_send(
                'courses',
                {
                    'type': 'broadcast_new_course',
                    'course': course
                }
            )
        
        elif action == 'new_assignment':
            assignment = await self.create_assignment(data['courseId'], data['assignment'])
            if assignment:
                await self.channel_layer.group_send(
                    'courses',
                    {
                        'type': 'broadcast_new_assignment',
                        'courseId': data['courseId'],
                        'assignment': assignment
                    }
                )
                await self.send_all_courses()

        elif action == 'submit_assignment':
            submission = await self.submit_assignment(
                data['assignmentId'],
                data['student'],
                data['file']
            )
            if submission:
                await self.channel_layer.group_send(
                    'courses',
                    {
                        'type': 'broadcast_submission',
                        'assignmentId': data['assignmentId'],
                        'submission': submission
                    }
                )
                await self.send_all_courses()

        elif action == 'grade_submission':
            grading = await self.grade_submission(
                data['submissionId'],
                data['grade'],
                data['feedback']
            )
            if grading:
                await self.channel_layer.group_send(
                    'courses',
                    {
                        'type': 'broadcast_grading',
                        'submissionId': data['submissionId'],
                        'grading': grading
                    }
                )
                await self.send_all_courses()

    async def broadcast_new_course(self, event):
        await self.send(json.dumps({
            'action': 'new_course',
            'course': event['course']
        }))

    async def broadcast_new_assignment(self, event):
        await self.send(json.dumps({
            'action': 'new_assignment',
            'courseId': event['courseId'],
            'assignment': event['assignment']
        }))

    async def broadcast_submission(self, event):
        await self.send(json.dumps({
            'action': 'new_submission',
            'assignmentId': event['assignmentId'],
            'submission': event['submission']
        }))

    async def broadcast_grading(self, event):
        await self.send(json.dumps({
            'action': 'submission_graded',
            'submissionId': event['submissionId'],
            'grading': event['grading']
        }))