import feedparser
from django.db.models import Q
from django.views.generic import TemplateView

from finsite.models import Currency


class IndexView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        search = self.request.GET.get('search')
        context['currency_list'] = Currency.objects.all().order_by('id')
        if search:
            context['currency_list'] = context['currency_list']\
                .filter(Q(name__icontains=search)|Q(code__icontains=search))
        context['news_list'] = self.get_news()
        return context

    def get_news(self):
        feeds_list = ['http://www.finanz.ru/rss/novosti']
        feeds = [feedparser.parse(f) for f in feeds_list]
        return sum([[{'title': x['title'], 'link': x['link'], 'date': x['published']} \
                                     for x in f['entries']] for f in feeds], [])