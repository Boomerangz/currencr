import feedparser
from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta
import decimal

from newspaper import Article

from finsite.models import Currency, CurrencyHistoryRecord, NewsItem


@periodic_task(run_every=timedelta(minutes=1))
def update_prices():
    for c in Currency.objects.all():
        try:
            c.previous_price = c.current_price
            c.current_price = c.data()['price']
            c.save()
            volume = c.data().get('volume')
            CurrencyHistoryRecord.objects.create(currency=c, price=c.current_price,\
                                                 volume=volume).save()
            print(c.code, c.current_price, 'updated')
        except Exception as e:
            print(c.code, e)


@periodic_task(run_every=timedelta(minutes=1))
def update_news():
    feeds_list = ['https://bitnovosti.com/feed/', 'http://www.finanz.ru/rss/novosti']
    print(feeds_list)
    feeds = [feedparser.parse(f) for f in feeds_list]
    news_list =  sum([[{'title': x['title'], 'link': x['link'], 'date': x['published']} \
                 for x in f['entries']] for f in feeds], [])
    for news in news_list:
        try:
            article = Article(news['link'], language='ru')
            article.download()
            article.parse()
            article.nlp()
            text = article.text
            title = article.title
            top_image = article.top_image
            keywords = article.keywords
            if NewsItem.objects.filter(link=news['link'], title__iexact=title).count() == 0:
                NewsItem.objects.create(link=news['link'], title=title, text=text, image=top_image, keywords=keywords)
        except Exception as e:
            print(e)