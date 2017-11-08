import requests
import re
from bs4 import BeautifulSoup

def get_news_data_from_bitsmedia(link):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:45.0) Gecko/20100101 Firefox/45.0'
    }
    r = requests.get(link, headers = headers)
    text = r.text
    soup = BeautifulSoup(text, 'html.parser')
    article = soup.find('div', {'class':'text_content'})
    [s.unwrap() for s in article.findAll('a')]
    title = soup.find('h1').text.strip()
    article.find('img').extract()

    for img in article.find_all('img'):
        src = img['src']
        if src.find('/') == 0 and src.find('//') != 0:
            img['src'] = "https://bits.media" + img['src']

    text = str(article)
    end_string = '<div class="article_footer"'
    if '<div class="article_footer"' in text:
        text = text[:text.index(end_string)]

    text = text.replace('\n','')
    length = 0
    while len(text) != length:
        length = len(text)
        text = text.replace('<br>','<br/>')
        text = text.replace('<br/><br/>','')
    
    return {'content':text, 'link':link, 'title':title}