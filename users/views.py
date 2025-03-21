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
    username = request.POST.get('username')
    session_key = cache.get(f'user_session_{username}')
    if session_key:
        return JsonResponse({'has_session': True})
    return JsonResponse({'has_session': False})

def force_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # Eliminar la sesión anterior
            old_session_key = cache.get(f'user_session_{username}')
            if old_session_key:
                cache.delete(f'user_session_{username}')
            
            # Crear nueva sesión
            login(request, user)
            cache.set(f'user_session_{username}', request.session.session_key, timeout=None)
            return JsonResponse({'success': True, 'redirect_url': '/chat/Sala/'})
        
    return JsonResponse({'success': False})

def login_page(request):
    if request.method == 'POST':
        username = request.POST.get('username')
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
            user = authenticate(request, username=username, password=password)
            if user is not None:
                # Verificar si existe una sesión activa
                existing_session = cache.get(f'user_session_{username}')
                if existing_session:
                    return render(request, 'login.html', {
                        'show_session_modal': True,
                        'username': username,
                        'password': password
                    })
                
                # Si no hay sesión activa, proceder con el login normal
                login(request, user)
                cache.set(f'user_session_{username}', request.session.session_key, timeout=None)
                messages.success(request, 'Login successful!')
                return redirect('/chat/Sala/')
            else:
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