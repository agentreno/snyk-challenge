from django.db import models


class Package(models.Model):
    name = models.CharField(max_length=50)
    dependency_tree = models.CharField(max_length=5000)

    def __str__(self):
        return self.name
