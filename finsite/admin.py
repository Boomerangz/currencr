# # -*- coding: utf-8 -*-

from django.contrib import admin

from finsite.models import Currency, NewsItem, KeywordSynonims

admin.site.register(Currency)
admin.site.register(NewsItem)
admin.site.register(KeywordSynonims)