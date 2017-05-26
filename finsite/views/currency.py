import feedparser
from django.views.generic import TemplateView

from finsite.models import Currency

class CurrencyView(TemplateView):
    template_name = 'currency_view.html'

    def get_context_data(self, code, **kwargs):
        context = super(CurrencyView, self).get_context_data(**kwargs)
        context['currency'] = Currency.objects.get(code__iexact=code)
        context['news_list'] = self.get_news()
        return context


    def get_news(self):
        feeds_list = ['http://www.finanz.ru/rss/novosti']
        feeds = [feedparser.parse(f) for f in feeds_list]
        return sum([[{'title': x['title'], 'link': x['link'], 'date': x['published']} \
                                     for x in f['entries']] for f in feeds], [])