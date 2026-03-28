# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')), # Or whatever your app is named

    path('', include('verifid.urls')),
    path('api/qr/', include('qr_generator.urls')),
] 

# This is the "bridge" that lets your browser see the files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)