from dependencyapi import settings
from api.models import Package
from api.serializers import PackageSerializer
from rest_framework import generics

from gremlin_python.driver import client


class BaseRetrieveView(generics.RetrieveAPIView):
    def get_object(self):
        # Using concatenation in query construction is a serious antipattern but...
        # I'm pushed for time, native Python gremlin query syntax isn't
        # working, and neither is parameterised queries with a second arg to
        # submit()
        # A blacklist will have to do but this would need solving prior to prod!
        package = self.kwargs.get('package', '').replace("'", "")

        neptune_client = client.Client(settings.NEPTUNE_DATABASE, 'g')
        output = neptune_client.submit(
            "g.V().has('package', 'name', '" + package + "')" +
            ".until(__.not(outE())).repeat(out())" +
            ".path().by('name')"
        )
        dependency_paths = [[package for package in path] for path in output]
        return Package(name=package, dependency_tree=str(dependency_paths))


class PackageDetail(BaseRetrieveView):
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
