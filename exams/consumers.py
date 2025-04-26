import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from .models import Exam, Question, Choice, ExamSubmission, Answer
from asgiref.sync import sync_to_async
from users.models import UserProfile
import random

class ExamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('exams', self.channel_name)
        await self.accept()
        await self.send_all_exams()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('exams', self.channel_name)

    @sync_to_async
    def get_user_profile_photo(self, username):
        try:
            user = User.objects.get(username=username)
            profile = UserProfile.objects.get(user=user)
            if profile.profile_photo:
                return profile.profile_photo.url
            return None
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return None

    @sync_to_async
    def get_all_exams(self):
        current_user = User.objects.get(username=self.scope['user'].username)
        exams = []
        
        for exam in Exam.objects.all().select_related('creator'):
            # Get creator's profile photo
            creator_photo = None
            try:
                creator_profile = UserProfile.objects.get(user=exam.creator)
                if creator_profile.profile_photo:
                    creator_photo = creator_profile.profile_photo.url
            except UserProfile.DoesNotExist:
                pass

            questions = []
            submission = None
            
            # Obtener la entrega existente si existe
            if current_user != exam.creator:
                submission = ExamSubmission.objects.filter(
                    exam=exam,
                    student=current_user
                ).first()

            # Si hay una entrega, usar las preguntas asignadas
            if submission:
                assigned_questions = submission.assigned_questions.all()
            else:
                assigned_questions = exam.questions.all()

            for question in assigned_questions:
                choices = []
                for choice in question.choices.all():
                    choices.append({
                        'id': choice.id,
                        'text': choice.text,
                        'is_correct': choice.is_correct if exam.creator == current_user else None
                    })
                
                questions.append({
                    'id': question.id,
                    'text': question.text,
                    'question_type': question.question_type,
                    'points': question.points,
                    'order': question.order,
                    'choices': choices
                })

            submissions = []
            if exam.creator == current_user:
                for submission in ExamSubmission.objects.filter(exam=exam).select_related('student'):
                    # Get student's profile photo
                    student_photo = None
                    try:
                        student_profile = UserProfile.objects.get(user=submission.student)
                        if student_profile.profile_photo:
                            student_photo = student_profile.profile_photo.url
                    except UserProfile.DoesNotExist:
                        pass

                    answers = []
                    for answer in submission.answers.all().prefetch_related('selected_choices'):
                        selected_choices = [choice.id for choice in answer.selected_choices.all()]
                        answers.append({
                            'question_id': answer.question.id,
                            'selected_choices': selected_choices,
                            'is_correct': answer.is_correct
                        })
                    
                    submissions.append({
                        'id': submission.id,
                        'student': {
                            'name': submission.student.username,
                            'avatar': student_photo or f'https://ui-avatars.com/api/?name={submission.student.username}&size=64&background=random'
                        },
                        'submitted_at': submission.submitted_at.strftime('%Y-%m-%d %H:%M'),
                        'score': submission.score,
                        'answers': answers
                    })
            else:
                submission = ExamSubmission.objects.filter(
                    exam=exam,
                    student=current_user
                ).first()
                
                if submission:
                    # Get current user's profile photo
                    user_photo = None
                    try:
                        user_profile = UserProfile.objects.get(user=current_user)
                        if user_profile.profile_photo:
                            user_photo = user_profile.profile_photo.url
                    except UserProfile.DoesNotExist:
                        pass

                    answers = []
                    for answer in submission.answers.all().prefetch_related('selected_choices'):
                        selected_choices = [choice.id for choice in answer.selected_choices.all()]
                        answers.append({
                            'question_id': answer.question.id,
                            'selected_choices': selected_choices,
                            'is_correct': answer.is_correct
                        })
                    
                    submissions.append({
                        'id': submission.id,
                        'student': {
                            'name': current_user.username,
                            'avatar': user_photo or f'https://ui-avatars.com/api/?name={current_user.username}&size=64&background=random'
                        },
                        'submitted_at': submission.submitted_at.strftime('%Y-%m-%d %H:%M'),
                        'score': submission.score,
                        'answers': answers
                    })

            exams.append({
                'id': exam.id,
                'title': exam.title,
                'description': exam.description,
                'creator': {
                    'name': exam.creator.username,
                    'avatar': creator_photo or f'https://ui-avatars.com/api/?name={exam.creator.username}&size=64&background=random'
                },
                'created_at': exam.created_at.strftime('%Y-%m-%d'),
                'total_points': exam.total_points,
                'is_active': exam.is_active,
                'questions': questions,
                'questions_to_answer': exam.questions_to_answer,
                'submissions': submissions,
                'submission': next((sub for sub in submissions if sub['student']['name'] == current_user.username), None)
            })
        
        return exams

    async def send_all_exams(self):
        exams = await self.get_all_exams()
        await self.send(json.dumps({
            'action': 'exams_update',
            'exams': exams
        }))

    @sync_to_async
    def create_exam(self, data):
        user = User.objects.get(username=data['creator']['name'])
        
        # Get creator's profile photo
        creator_photo = None
        try:
            creator_profile = UserProfile.objects.get(user=user)
            if creator_profile.profile_photo:
                creator_photo = creator_profile.profile_photo.url
        except UserProfile.DoesNotExist:
            pass

        exam = Exam.objects.create(
            title=data['title'],
            description=data['description'],
            creator=user,
            total_points=100,
            is_active=True,
            questions_to_answer=data['questions_to_answer']
        )

        points_per_question = 100 // len(data['questions'])
        remaining_points = 100 % len(data['questions'])

        for i, q_data in enumerate(data['questions']):
            question_points = points_per_question + (remaining_points if i == len(data['questions']) - 1 else 0)
            
            question = Question.objects.create(
                exam=exam,
                text=q_data['text'],
                question_type=q_data['type'],
                points=question_points,
                order=i + 1
            )

            for c_data in q_data['choices']:
                Choice.objects.create(
                    question=question,
                    text=c_data['text'],
                    is_correct=c_data['is_correct']
                )

        return {
            'id': exam.id,
            'title': exam.title,
            'description': exam.description,
            'creator': {
                'name': exam.creator.username,
                'avatar': creator_photo or f'https://ui-avatars.com/api/?name={exam.creator.username}&size=64&background=random'
            },
            'created_at': exam.created_at.strftime('%Y-%m-%d'),
            'total_points': exam.total_points,
            'is_active': exam.is_active,
            'questions': [{
                'id': q.id,
                'text': q.text,
                'question_type': q.question_type,
                'points': q.points,
                'order': q.order,
                'choices': [{
                    'id': c.id,
                    'text': c.text,
                    'is_correct': c.is_correct
                } for c in q.choices.all()]
            } for q in exam.questions.all()],
            'questions_to_answer': exam.questions_to_answer,
            'submissions': []
        }

    @sync_to_async
    def submit_exam(self, data):
        exam = Exam.objects.get(id=data['examId'])
        student = User.objects.get(username=data['student'])
        
        # Get student's profile photo
        student_photo = None
        try:
            student_profile = UserProfile.objects.get(user=student)
            if student_profile.profile_photo:
                student_photo = student_profile.profile_photo.url
        except UserProfile.DoesNotExist:
            pass

        # Obtener o crear la entrega
        submission, created = ExamSubmission.objects.get_or_create(
            exam=exam,
            student=student,
            defaults={
                'completed': True
            }
        )

        # Si es una nueva entrega, asignar preguntas aleatorias
        if created:
            all_questions = list(exam.questions.all())
            random_questions = random.sample(all_questions, exam.questions_to_answer)
            submission.assigned_questions.set(random_questions)
        
        if not created:
            submission.answers.all().delete()
            submission.completed = True
            submission.save()

        total_correct = 0
        total_questions = submission.assigned_questions.count()

        for answer_data in data['answers']:
            question = Question.objects.get(id=answer_data['questionId'])
            # Verificar que la pregunta está asignada al estudiante
            if question not in submission.assigned_questions.all():
                continue

            answer = Answer.objects.create(
                submission=submission,
                question=question
            )

            selected_choices = Choice.objects.filter(id__in=answer_data['selectedChoices'])
            answer.selected_choices.set(selected_choices)

            if question.question_type == 'single':
                is_correct = selected_choices.filter(is_correct=True).exists()
            else:  # multiple
                correct_choices = question.choices.filter(is_correct=True)
                selected_correct = selected_choices.filter(is_correct=True)
                selected_incorrect = selected_choices.filter(is_correct=False)
                is_correct = (selected_correct.count() == correct_choices.count() and 
                            selected_incorrect.count() == 0)

            answer.is_correct = is_correct
            answer.save()

            if is_correct:
                total_correct += 1

        submission.score = round((total_correct / total_questions) * 100)
        submission.save()

        return {
            'id': submission.id,
            'student': {
                'name': student.username,
                'avatar': student_photo or f'https://ui-avatars.com/api/?name={student.username}&size=64&background=random'
            },
            'submitted_at': submission.submitted_at.strftime('%Y-%m-%d %H:%M'),
            'score': submission.score,
            'answers': [{
                'question_id': answer.question.id,
                'selected_choices': [choice.id for choice in answer.selected_choices.all()],
                'is_correct': answer.is_correct
            } for answer in submission.answers.all()]
        }

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'request_exams':
            await self.send_all_exams()
        
        elif action == 'new_exam':
            exam = await self.create_exam(data['exam'])
            await self.channel_layer.group_send(
                'exams',
                {
                    'type': 'broadcast_new_exam',
                    'exam': exam
                }
            )
            await self.send_all_exams()
        
        elif action == 'submit_exam':
            submission = await self.submit_exam(data)
            if submission:
                await self.channel_layer.group_send(
                    'exams',
                    {
                        'type': 'broadcast_submission',
                        'examId': data['examId'],
                        'submission': submission
                    }
                )
                await self.send_all_exams()

    async def broadcast_new_exam(self, event):
        await self.send(json.dumps({
            'action': 'new_exam',
            'exam': event['exam']
        }))

    async def broadcast_submission(self, event):
        await self.send(json.dumps({
            'action': 'exam_submitted',
            'examId': event['examId'],
            'submission': event['submission']
        }))