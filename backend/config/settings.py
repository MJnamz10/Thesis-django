import os
from pathlib import Path
import environ

# Initialize environ
env = environ.Env()

# 1. DEFINE BASE_DIR FIRST (Line 4 was crashing because this was missing or below it)
BASE_DIR = Path(__file__).resolve().parent.parent

environ.Env.read_env(BASE_DIR / '.env')

DEBUG = True 
ALLOWED_HOSTS = ['192.168.1.19', 'localhost', '127.0.0.1', '192.168.1.22', 'backend', '10.22.180.162', '192.168.89.162', '192.168.1.14'] #add raspis IPs here as needed

# ==========================================
DATABASES = {
     'default': env.db(),
 }

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'api',        # From your original list
    'verifid',    # Our new scanner app
    'qr_generator',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
AUTHENTICATION_BACKENDS = [
    'api.backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]

ROOT_URLCONF = 'config.urls'  # Assuming your project folder is named 'config'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
SECRET_KEY = 'django-insecure-your-secret-key-here-change-in-production'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://192.168.1.19:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.22:5173", # Add the Raspberry Pi's IP address with the correct port
    "http://10.22.180.162:5173", # Add the Raspberry Pi's IP address with the correct port
    "http://192.168.89.162:5173", #khael27 ip add
    "http://192.168.1.14:5173"
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

GATE_API_KEY = "USTP_Gate_Scanner_Key_9x8B2vL5y"
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
# Pulling the secure credentials from your .env file!
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
TIME_ZONE = 'Asia/Manila'
USE_TZ = True