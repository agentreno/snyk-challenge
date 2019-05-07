from api.models import Package
from api.serializers import PackageSerializer
from rest_framework import generics


class PackageList(generics.ListCreateAPIView):
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
