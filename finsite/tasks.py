import feedparser
from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta, datetime
import decimal
import requests
import pytz
from django.db.models import Q

from newspaper import Article

from finsite.models import Currency, CurrencyHistoryRecord, NewsItem, Exchange


@periodic_task(run_every=timedelta(seconds=30))
def update_prices():
    url_template = "https://min-api.cryptocompare.com/data/histominute?fsym=%s&tsym=USD&limit=%d&aggregate=1&e=%s"
    for exc in Exchange.objects.all():        
        for curr in Currency.objects.filter(exchange_list__id=exc.id):
            last_time = CurrencyHistoryRecord.objects.filter(currency=curr, exchange=exc).order_by('-time').first()
            if last_time:
                last_time = last_time.time
                now = datetime.now()
                now = pytz.utc.localize(now)
                delta = (now - last_time).seconds
                count = int(delta / 60) or 5
            else:
                count = 2000



            url = url_template % (curr.code, count, exc.name)
            r = requests.get(url)
            parsed_data = r.json()
            for d in parsed_data["Data"][:-1]:
                histime = datetime.fromtimestamp(d["time"])
                if CurrencyHistoryRecord.objects.filter(time=histime, currency=curr, exchange=exc).count()==0:
                    CurrencyHistoryRecord.objects.create(currency=curr, price=d["close"], volume=d["volumeto"], time=histime, exchange=exc)

            if exc == curr.selected_exchange:
                last_history = CurrencyHistoryRecord.objects.filter(currency=curr, exchange=exc).order_by('-time').first()
                days_ago = CurrencyHistoryRecord.objects.filter(time__lte=datetime.now()-timedelta(days=1), currency=curr, exchange=exc).order_by('-id').first()
                if days_ago is not None:
                    curr.current_price = last_history.price
                    curr.previous_price = days_ago.price
                curr.save()


@periodic_task(run_every=timedelta(minutes=5))
def update_news_ru():
    feeds_list = ['https://bitnovosti.com/feed/']
    feeds = [feedparser.parse(f) for f in feeds_list]
    news_list =  sum([[{'title': x['title'], 'link': x['link'], 'date': x['published']} \
                 for x in reversed(f['entries'])] for f in feeds], [])
    news_list.extend(map(lambda x: {'link':x}, reversed(list(get_news_from_bitmedia()))))
    news_list.extend(map(lambda x: {'link':x}, reversed(list(get_news_from_forklog()))))
    existing_links = set(NewsItem.objects.filter(link__in=[n['link'] for n in news_list]).values_list('link', flat=True))
    news_list = [n for n in news_list if n['link'] not in existing_links]
    for news in news_list:
        try:
            article = Article(news['link'], language='ru')
            article.download()
            article.parse()
            article.nlp()
            title = article.title
            if 'ТАСС:' in title:
                continue
            text = article.content
            top_image = article.top_image
            keywords = article.keywords

            if 'forklog' in news['link']:
                text = get_news_data_from_forklog(news['link'])['content']
            if 'bitnovosti.com' in news['link']:
                data = get_news_data_from_bitnovosti(news['link'])
                text = data['content']
                title = data['title']

            text = '<br/>'.join([s for s in text.split('\n') if 'Categories:' not in s and 'Tags:' not in s]).strip()
            if 'Материал предоставил' in text:
                text = text[:text.find('Материал предоставил')]
            text = text.replace('on •<br/><br/>','')
            text = text.replace('<br/>Источник<br/>','')
            summary = get_summary(article.text)
            
            if top_image == 'http://www.finanz.ru/Images/FacebookIcon.jpg':
                top_image = None
            
            if NewsItem.objects.filter(title__iexact=title).count() == 0:
                NewsItem.objects.create(link=news['link'],
                                        title=title,
                                        text=text,
                                        image=top_image,
                                        keywords=keywords,
                                        language='ru')
        except Exception as e:
            print(e)


@periodic_task(run_every=timedelta(minutes=5))
def update_news_en():
    feeds_list = ['https://cryptoinsider.com/feed/']
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
            top_image = article.top_image
            if top_image == 'http://www.finanz.ru/Images/FacebookIcon.jpg':
                top_image = None
            keywords = article.keywords
            if NewsItem.objects.filter(title__iexact=title).count() == 0:
                NewsItem.objects.create(link=news['link'],
                                        title=title,
                                        text=text,
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


def get_news_from_forklog():
    import requests
    import re
    from bs4 import BeautifulSoup
    link = 'http://forklog.com/news/'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:45.0) Gecko/20100101 Firefox/45.0'
    }
    r = requests.get(link, headers = headers)
    text = r.text
    soup = BeautifulSoup(text, 'html.parser')
    article_list = soup.findAll('article', {'class':'post'})
    for article in article_list:
        link = article.find('a')
        if not link:
                continue
        yield link['href']




def get_news_data_from_forklog(link):
    import requests
    import re
    from bs4 import BeautifulSoup
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:45.0) Gecko/20100101 Firefox/45.0'
    }
    r = requests.get(link, headers = headers)
    text = r.text
    soup = BeautifulSoup(text, 'html.parser')
    article = soup.find('section', {'id':'article_content'})
    [s.extract() for s in article.findAll('section', {'id':'article_share'})]
    [s.extract() for s in article.findAll('div', {'id':'article_meta'})]
    [s.unwrap() for s in article.findAll('a')]
    title = article.find('h1').text
    article.find('h1').extract()
    text = str(article)
    text = text.replace('<p>Подписывайтесь на новости ForkLog в Twitter!</p>', '')
    text = text.replace('<p>Подписывайтесь на новости Forklog в  VK!</p>', '')
    text = text.replace('<p>Подписывайтесь на новости ForkLog в VK!</p>', '')
    text = text.replace('<p>Подписывайтесь на новости Forklog в Telegram!</p>', '')
    text = text.replace('\n','')
    length = 0
    while len(text) != length:
        length = len(text)
        text = text.replace('<br>','<br/>')
        text = text.replace('<br/><br/>','<br/>')
    return {'content':text, 'link':link, 'title':title}



def get_news_data_from_bitnovosti(link):
    import requests
    import re
    from bs4 import BeautifulSoup
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:45.0) Gecko/20100101 Firefox/45.0'
    }
    r = requests.get(link, headers = headers)
    text = r.text
    soup = BeautifulSoup(text, 'html.parser')
    article = soup.find('section', {'class':'entry'})
    [s.unwrap() for s in article.findAll('a')]
    title = soup.find('h1', {'class':'posttitle'}).text.strip()
    article.find('img').extract()
    text = str(article)
    if '<div class="pd-rating"' in text:
        text = text[:text.index('<div class="pd-rating"')]
    text = text.replace('<p>Подписывайтесь на Bitnovosti в telegram!</p>', '')
    text = text.replace('Источник', '')
    text = text.replace('<p>Related</p>', '')

    text = text.replace('\n','')
    length = 0
    while len(text) != length:
        length = len(text)
        text = text.replace('<br>','<br/>')
        text = text.replace('<br/><br/>','')
    
    return {'content':text, 'link':link, 'title':title}