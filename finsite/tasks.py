import feedparser
from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta, datetime
import decimal

from newspaper import Article

from finsite.models import Currency, CurrencyHistoryRecord, NewsItem


@periodic_task(run_every=timedelta(minutes=1))
def update_prices():
    for c in Currency.objects.all():
        try:
            days_ago_price = CurrencyHistoryRecord.objects.filter(time__lte=datetime.now()-timedelta(days=1), currency=c).order_by('-id').first()
            c.previous_price = days_ago_price.price
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
    feeds_list = ['https://bitnovosti.com/feed/']
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
            title = article.title
            if 'ТАСС:' in title:
                continue
            text = '<br/>'.join([s for s in article.text.split('\n') if 'Categories:' not in s and 'Tags:' not in s]).strip()
            summary = article.summary
            top_image = summary.top_image
            if top_image == 'http://www.finanz.ru/Images/FacebookIcon.jpg':
                top_image = None
            keywords = article.keywords
            if NewsItem.objects.filter(title__iexact=title).count() == 0:
                NewsItem.objects.create(link=news['link'],
                                        title=title,
                                        text=text,
                                        summary=summary,
                                        image=top_image,
                                        keywords=keywords)
        except Exception as e:
            print(e)