import feedparser
from django.db.models import Q
from newspaper import Article

from django.views.generic import TemplateView

from finsite.models import NewsItem, KeywordSynonims, Currency


class NewsView(TemplateView):
    template_name = 'news.html'

    def get_context_data(self, pk, *args, **kwargs):
        context = super(NewsView, self).get_context_data(*args, **kwargs)
        article = NewsItem.objects.get(pk=pk)
        context['article'] = article
        return context



def get_news(search=None, limit=10):
    if not search:
        return NewsItem.objects.all().order_by('-id')[:40]
    else:
        search_keywords = [search] + [c['name'] for c in Currency.objects.filter(code__iexact=search).values('name')]
        search_keywords = [s.lower() for s in search_keywords]
        keywords_with_synonims = sum(map(lambda x: x['synonyms'], KeywordSynonims.objects.filter(
            synonyms__overlap=search_keywords).values('synonyms')), [])
        filters = Q(keywords__overlap=keywords_with_synonims)
        for k in keywords_with_synonims:
            filters = filters | Q(title__icontains=k)
        return NewsItem.objects.filter(filters).order_by('-id')[:limit]
