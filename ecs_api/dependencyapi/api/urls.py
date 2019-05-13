from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns
from api import views

urlpatterns = [
    url(r'^package/(?P<package>[a-zA-Z0-9@/]+)/(?P<version>[a-zA-Z0-9.]+)/$', views.PackageDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
