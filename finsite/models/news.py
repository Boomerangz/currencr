from django.db import models
from django.contrib.postgres.fields import ArrayField

class NewsItem(models.Model):
    title = models.CharField(max_length=500, null=False, blank=False)
    summary = models.TextField(default=None, null=True, blank=True)
    link = models.CharField(max_length=1024, unique=True, null=False, blank=False)
    text = models.TextField(null=False, blank=False)
    keywords = ArrayField(models.CharField(max_length=200), blank=True)
    image = models.CharField(max_length=500, blank=True, default=None, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)



class KeywordSynonims(models.Model):
    name = models.CharField(max_length=255)
    synonyms = ArrayField(models.CharField(max_length=200), blank=True)