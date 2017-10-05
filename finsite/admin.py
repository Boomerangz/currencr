# # -*- coding: utf-8 -*-

from django.contrib import admin

from finsite.models import Currency, NewsItem, KeywordSynonims, Exchange, NewsTextReplacement

admin.site.register(Currency)
admin.site.register(NewsItem)
admin.site.register(NewsTextReplacement)
admin.site.register(KeywordSynonims)
admin.site.register(Exchange)
