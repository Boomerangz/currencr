import feedparser
from django.utils import translation
from django.views.generic import TemplateView

from finsite.models import Currency
from finsite.views.news import get_news


class CurrencyView(TemplateView):
    template_name = 'currency.html'

    def get_context_data(self, code, **kwargs):
        context = super(CurrencyView, self).get_context_data(**kwargs)
        context['currency'] = Currency.objects.get(url_code__iexact=code)
        context['news_list'] = get_news(search=context['currency'].name, language=translation.get_language())
        return context