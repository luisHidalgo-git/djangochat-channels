from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.conf import settings
import requests
from django.core.cache import cache
from django.http import JsonResponse
import json

def index(request):
    return render(request, "index.html", {'breadcrumb': 'Inicio'})

def check_existing_session(request):
    email = request.POST.get('email')
    try:
        user = User.objects.get(email=email)
        session_key = cache.get(f'user_session_{user.username}')
        if session_key:
            return JsonResponse({'has_session': True})
    except User.DoesNotExist:
        pass
    return JsonResponse({'has_session': False})

def force_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                # Eliminar la sesión anterior
                old_session_key = cache.get(f'user_session_{user.username}')
                if old_session_key:
                    cache.delete(f'user_session_{user.username}')
                
                # Crear nueva sesión
                login(request, user)
                cache.set(f'user_session_{user.username}', request.session.session_key, timeout=None)
                return JsonResponse({'success': True, 'redirect_url': '/chat/Sala/'})
        except User.DoesNotExist:
            pass
        
    return JsonResponse({'success': False})

def check_user(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        
        try:
            user = User.objects.get(email=email, username=username)
            return render(request, 'signup.html', {
                'email': email,
                'username': username,
                'is_password_reset': True
            })
        except User.DoesNotExist:
            messages.error(request, 'No account found with these credentials.')
            return redirect('login')
    return redirect('login')

def update_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            messages.error(request, 'Passwords do not match.')
            return render(request, 'signup.html', {
                'email': email,
                'username': username,
                'is_password_reset': True
            })

        try:
            user = User.objects.get(email=email, username=username)
            user.set_password(password)
            user.save()
            messages.success(request, 'Password updated successfully. Please login with your new password.')
            return redirect('login')
        except User.DoesNotExist:
            messages.error(request, 'Error updating password. Please try again.')
            return redirect('login')

    return redirect('login')

def login_page(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        recaptcha_response = request.POST.get('g-recaptcha-response')

        # Verificar el captcha
        data = {
            'secret': settings.RECAPTCHA_SECRET_KEY,
            'response': recaptcha_response
        }
        response = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
        result = response.json()

        if result['success']:
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    # Verificar si existe una sesión activa
                    existing_session = cache.get(f'user_session_{user.username}')
                    if existing_session:
                        return render(request, 'login.html', {
                            'show_session_modal': True,
                            'email': email,
                            'password': password
                        })
                    
                    # Si no hay sesión activa, proceder con el login normal
                    login(request, user)
                    cache.set(f'user_session_{user.username}', request.session.session_key, timeout=None)
                    messages.success(request, 'Login successful!')
                    return redirect('/chat/Sala/')
                else:
                    messages.error(request, 'Invalid email or password. Please try again.')
            except User.DoesNotExist:
                messages.error(request, 'Invalid email or password. Please try again.')
        else:
            messages.error(request, 'Please verify that you are not a robot.')

    if request.user.is_authenticated:
        return redirect('/chat/Sala/')
    return render(request, 'login.html', {'breadcrumb': 'Login'})

@login_required
def logout_page(request):
    if request.user.is_authenticated:
        cache.delete(f'user_session_{request.user.username}')
    logout(request)  
    messages.success(request, 'You have been logged out successfully.') 
    return redirect('/')

def signup_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        password1 = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # Check if passwords match
        if password1 != confirm_password:
            messages.error(request, 'Passwords do not match. Please try again.')
            return render(request, 'signup.html')

        # Check if email is already taken
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email is already in use. Please try another.')
            return render(request, 'signup.html')

        # Create the new user
        user = User.objects.create_user(username=username, 
                                        email=email,
                                        password=password1
                                        )
        user.save()
        messages.success(request, 'Signup successful! You can now log in.')
        return redirect('login')
    if request.user.is_authenticated:
        return redirect('/chat/Sala/')
    return render(request, 'signup.html', {'breadcrumb': 'Signup'})