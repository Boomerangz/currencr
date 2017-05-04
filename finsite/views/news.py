import feedparser
from newspaper import Article

from django.views.generic import TemplateView
class NewsView(TemplateView):
    template_name = 'news.html'

    def get_context_data(self, *args, **kwargs):
        context = super(NewsView, self).get_context_data(*args, **kwargs)
        if not self.request.GET.get('url'):
            feeds = feedparser.parse('http://www.finanz.ru/rss/novosti')
            context['news_list'] = [{'title':x['title'], 'link':x['link']} for x in feeds['entries']]
        else:
            url = self.request.GET.get('url')
            article = Article(url, language='ru')
            article.download()
            article.parse()
            context['article'] = article
        return context
