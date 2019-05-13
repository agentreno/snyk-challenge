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
        version = self.kwargs.get('version', '').replace("'", "")

        neptune_client = client.Client(settings.NEPTUNE_DATABASE, 'g')
        query = (
            f"g.V().has('version', 'fqname', '{package}@{version}')"
            ".until(__.not(out('depends').simplePath())).repeat(out('depends').simplePath())"
            ".tree().by('fqname')"
        )
        print(query)
        output = neptune_client.submit(query)
        result = output.all().result()
        return Package(name=package, dependency_tree=str(result))


class PackageDetail(BaseRetrieveView):
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
