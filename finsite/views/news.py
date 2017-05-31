import feedparser
from newspaper import Article

from django.views.generic import TemplateView

from finsite.models import NewsItem


class NewsView(TemplateView):
    template_name = 'news.html'

    def get_context_data(self, *args, **kwargs):
        context = super(NewsView, self).get_context_data(*args, **kwargs)
        if not self.request.GET.get('id'):
            context['news_list'] = get_news()
        else:
            news_id = self.request.GET.get('id')
            article = NewsItem.objects.get(pk=news_id)
            context['article'] = article
        return context



def get_news(search=None):
    return NewsItem.objects.all().order_by('-id')[:10]