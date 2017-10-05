from datetime import datetime
from django.db import models
from django.contrib.postgres.fields import ArrayField
from cacheops import cached
from html.parser import HTMLParser
from finsite import models as fin_models


class NewsItem(models.Model):
    title = models.CharField(max_length=500, null=False, blank=False)
    summary = models.TextField(default=None, null=True, blank=True)
    link = models.CharField(max_length=1024, unique=True, null=False, blank=False)
    text = models.TextField(null=False, blank=False)
    keywords = ArrayField(models.CharField(max_length=200), blank=True)
    image = models.CharField(max_length=500, blank=True, default=None, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    language = models.CharField(max_length=8, default="ru")

    def __str__(self):
        return "%d %s %s"%(self.id, self.title, datetime.strftime(self.created_at, "%Y-%m-%d %H:%M"))

    def summary(self):
        summary = strip_tags(self.text.replace('<br>','\n').replace('<br/>','\n').strip())        
        summary = '\n'.join([s.strip() for s in summary.split('\n')])
        summary_len = 0
        while summary_len != len(summary):
            summary_len = len(summary)
            summary = summary.replace('\n\n', '\n')
            summary = summary.replace('  ', ' ')
        summary = summary[:600]
        if '\n' in summary:
            summary = '\n'.join(summary.split('\n')[1:])
        if '.' in summary:
            summary = '.'.join(summary.split('.')[:-1])+'\n...'
        else:
            summary = ' '.join(summary.split(' ')[:-1])+'...'
        return summary


class NewsTextReplacement(models.Model):
    from_string = models.CharField(max_length=255)
    to_string = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return "%d '%s'" % (self.id, self.from_string)

class KeywordSynonims(models.Model):
    name = models.CharField(max_length=255)
    synonyms = ArrayField(models.CharField(max_length=200), blank=True)

    def __str__(self):
        return self.name



    from html.parser import HTMLParser

class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.strict = False
        self.convert_charrefs= True
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return ''.join(self.fed)

def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()



