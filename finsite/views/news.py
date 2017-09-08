
from django.db.models import Q
from django.utils.translation import get_language

from django.views.generic import TemplateView

from finsite.models import NewsItem, KeywordSynonims, Currency

from django.utils import translation


class NewsView(TemplateView):
    template_name = 'news.html'

    def get_context_data(self, pk, *args, **kwargs):
        context = super(NewsView, self).get_context_data(*args, **kwargs)
        article = NewsItem.objects.get(pk=pk)
        context['article'] = article
        news_list = list(get_news(limit=10, language=translation.get_language()))
        smart_news_list = []
        counter = 0
        for n in news_list:
            if len(n.image) > 0 and article.title != n.title and counter < 2:
                smart_news_list.append(n)
                counter += 1
        context['smart_news_list'] = smart_news_list
        return context



def get_news(search=None, limit=10, language=get_language()):
    language = language.split('-')[0]
    print(language)
    if not search:
        return NewsItem.objects.filter(language=language).order_by('-id')[:limit]
    else:
        search_keywords = [search] + [c['name'] for c in Currency.objects.filter(code__iexact=search).values('name')]
        search_keywords = [s.lower() for s in search_keywords]
        keywords_with_synonims = sum(map(lambda x: x['synonyms'], KeywordSynonims.objects.filter(
            synonyms__overlap=search_keywords).values('synonyms')), [])
        filters = Q(keywords__overlap=keywords_with_synonims)
        for k in keywords_with_synonims:
            filters = filters | Q(title__icontains=k)
        return NewsItem.objects.filter(filters, language__iexact=language).order_by('-id')[:limit]
