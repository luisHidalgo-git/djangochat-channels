from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.conf import settings
import requests

def index(request):
    return render(request, "index.html", {'breadcrumb': 'Inicio'})

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
                login(request, user)
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