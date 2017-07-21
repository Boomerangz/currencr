"""finsite URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
import os
import git
from cacheops import cached_view_as

from django.conf.urls import url
from django.contrib import admin

from finsite import settings
from finsite.models import Currency, NewsItem
from finsite.views.api_history import get_stock_history
from finsite.views.api_history_db import get_stock_history_from_db
from finsite.views.api_prediction import get_prediction
from finsite.views.api_refresh import get_stock_fresh
from finsite.views.currency import CurrencyView
from finsite.views.index import IndexView
from finsite.views.news import NewsView


from rest_framework.decorators import api_view
from rest_framework.response import Response
@api_view(['GET'])
def gitpull(request):
    dir = settings.BASE_DIR
    print(dir)
    g = git.cmd.Git(dir)
    g.pull()
    return Response({"status":"success"})


urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^$', IndexView.as_view()),
    url(r'^news/(?P<pk>[0-9]+)/$', NewsView.as_view()),
    url(r'^pull/$', gitpull),
    url(r'^(?P<code>[a-zA-Z\-]+)/$', cached_view_as(NewsItem, timeout=60)(CurrencyView.as_view())),
    url(r'^(?P<code>[a-zA-Z\-]+)/history_db/$', get_stock_history_from_db),
    url(r'^(?P<code>[a-zA-Z\-]+)/history/$', get_stock_history),
    url(r'^(?P<code>[a-zA-Z\-]+)/fresh/$', get_stock_fresh),
    url(r'^(?P<code>[a-zA-Z\-]+)/prediction/$', get_prediction),
]
