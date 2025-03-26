from django.urls import path
from users.views import logout_page, signup_view, index, login_page, check_existing_session, force_login, check_user, update_password

urlpatterns = [
    path('', index, name="index"),
    path('logout/', logout_page, name="logout"),
    path('signup/', signup_view, name="signup"),
    path('login/', login_page, name="login"),
    path('check-session/', check_existing_session, name='check_session'),
    path('force-login/', force_login, name='force_login'),
    path('check-user/', check_user, name='check_user'),
    path('update-password/', update_password, name='update_password'),
]