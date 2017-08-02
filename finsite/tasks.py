import feedparser
from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta, datetime
import decimal
import requests
import pytz

from newspaper import Article

from finsite.models import Currency, CurrencyHistoryRecord, NewsItem


@periodic_task(run_every=timedelta(seconds=30))
def update_prices_task():
    update_prices(exchange_name="Kraken", update_currency=True)
    update_prices(exchange_name="Poloniex", update_currency=False)

def update_prices(exchange_name="Kraken", update_currency=True):
    url_template = "https://min-api.cryptocompare.com/data/histominute?fsym=%s&tsym=USD&limit=%d&aggregate=1&e=%s"


    for curr in Currency.objects.all():
        last_time = CurrencyHistoryRecord.objects.filter(currency=curr, exchange=exchange_name).order_by('-time').first()
        if last_time:
            last_time = last_time.time
            now = datetime.now()
            now = pytz.utc.localize(now)
            delta = (now - last_time).seconds
            count = int(delta / 60) or 5
        else:
            count = 2000



        url = url_template % (curr.code, count, exchange_name if curr.code != "BCC" else "Bitfinex")
        r = requests.get(url)
        parsed_data = r.json()
        for d in parsed_data["Data"][:-1]:
            histime = datetime.fromtimestamp(d["time"])
            if CurrencyHistoryRecord.objects.filter(time=histime, currency=curr, exchange=exchange_name).count()==0:
                CurrencyHistoryRecord.objects.create(currency=curr, price=d["close"], volume=d["volumeto"], time=histime, exchange=exchange_name)

        if update_currency:
            last_history = CurrencyHistoryRecord.objects.filter(currency=curr, exchange=exchange_name).order_by('-time').first()
            days_ago = CurrencyHistoryRecord.objects.filter(time__lte=datetime.now()-timedelta(days=1), currency=curr, exchange=exchange_name).order_by('-id').first()
            if days_ago is not None:
                curr.current_price = last_history.price
                curr.previous_price = days_ago.price
                print(curr.code, curr.current_price, curr.previous_price)
            curr.save()


@periodic_task(run_every=timedelta(minutes=5))
def update_news_ru():
    feeds_list = ['https://bitnovosti.com/feed/']
    print(feeds_list)
    feeds = [feedparser.parse(f) for f in feeds_list]
    news_list =  sum([[{'title': x['title'], 'link': x['link'], 'date': x['published']} \
                 for x in reversed(f['entries'])] for f in feeds], [])
    news_list.extend(map(lambda x: {'link':x}, reversed(list(get_news_from_bitmedia()))))
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
            if 'Материал предоставил' in text:
                text = text[:text.find('Материал предоставил')]
            text = text.replace('on •<br/><br/>','')
            text = text.replace('<br/>Источник<br/>','')
            summary = article.summary
            top_image = article.top_image
            if top_image == 'http://www.finanz.ru/Images/FacebookIcon.jpg':
                top_image = None
            keywords = article.keywords
            if NewsItem.objects.filter(Q(title__iexact=title)|Q(link__iexact=news['link'])).count() == 0:
                NewsItem.objects.create(link=news['link'],
                                        title=title,
                                        text=text,
                                        summary=summary,
                                        image=top_image,
                                        keywords=keywords,
                                        language='ru')
        except Exception as e:
            print(e)

@periodic_task(run_every=timedelta(minutes=5))
def update_news_en():
    feeds_list = ['https://cryptoinsider.com/feed/']
    print(feeds_list)
    feeds = [feedparser.parse(f) for f in feeds_list]
    news_list =  sum([[{'title': x['title'], 'link': x['link'], 'date': x['published']} \
                 for x in f['entries']] for f in feeds], [])
    for news in news_list:
        try:
            article = Article(news['link'], language='en')
            article.download()
            article.parse()
            article.nlp()
            title = article.title
            if 'ТАСС:' in title:
                continue
            text = '<br/>'.join([s for s in article.text.split('\n') if 'Categories:' not in s and 'Tags:' not in s]).strip()
            summary = article.summary
            top_image = article.top_image
            if top_image == 'http://www.finanz.ru/Images/FacebookIcon.jpg':
                top_image = None
            keywords = article.keywords
            if NewsItem.objects.filter(title__iexact=title).count() == 0:
                NewsItem.objects.create(link=news['link'],
                                        title=title,
                                        text=text,
                                        summary=summary,
                                        image=top_image,
                                        keywords=keywords,
                                        language='en')
        except Exception as e:
            print(e)


def get_news_from_bitmedia():
    import requests
    import re
    link = 'https://bits.media/news/'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:45.0) Gecko/20100101 Firefox/45.0'
    }
    r = requests.get(link, headers = headers)
    text = r.text
    regex = '<a href="\/news\/[a-zA-z0-9\-]+\/">'
    i = 0
    for m in re.finditer(regex, text):
        i += 1
        if i>=20:
            break
        yield "https://bits.media%s" % m.group(0).replace('<a href="', '').replace('">', '')
