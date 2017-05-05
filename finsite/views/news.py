import feedparser
from newspaper import Article

from django.views.generic import TemplateView
class NewsView(TemplateView):
    template_name = 'news.html'

    def get_context_data(self, *args, **kwargs):
        context = super(NewsView, self).get_context_data(*args, **kwargs)
        if not self.request.GET.get('url'):
            feeds_list = ['http://www.finanz.ru/rss/novosti']
            feeds = [feedparser.parse(f) for f in feeds_list]
            context['news_list'] = sum([[{'title':x['title'], 'link':x['link'], 'date':x['']} \
                for x in f['entries']] for f in feeds], [])
        else:
            url = self.request.GET.get('url')
            article = Article(url, language='ru')
            article.download()
            article.parse()
            context['article'] = article
        return context
