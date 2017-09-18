import requests
import re
from bs4 import BeautifulSoup

def get_news_data_from_cryptoinsider(link):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:45.0) Gecko/20100101 Firefox/45.0'
    }
    r = requests.get(link, headers = headers)
    text = r.text
    soup = BeautifulSoup(text, 'html.parser')
    article = soup.find('div', {'class':'post-content'})
    [s.unwrap() for s in article.findAll('a')]
    title = soup.find('h1', {'class':'entry-title'}).text
    text = str(article)
    remove_after = '<div class="et_social_inline'
    if remove_after in text:
        text = text[:text.index(remove_after)]
    remove_after = '<p><strong>See Also:'
    if remove_after in text:
        text = text[:text.index(remove_after)]
        
    text = text.replace('\n','')
    length = 0
    while len(text) != length:
        length = len(text)
        text = text.replace('<br>','<br/>')
        text = text.replace('<br/><br/>','<br/>')
    return {'content':text, 'link':link, 'title':title}



def get_news_data_from_coindesk(link):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:45.0) Gecko/20100101 Firefox/45.0'
    }
    r = requests.get(link, headers = headers)
    text = r.text
    soup = BeautifulSoup(text, 'html.parser')
    article = soup.find('div', {'class':'article-content-container'})
    [s.unwrap() for s in article.findAll('a')]
    title = soup.find('h3', {'class':'featured-article-title'}).text
    text = str(article)
    remove_after = '<p style="border-top: 5px solid #f2f2f2;'
    if remove_after in text:
        text = text[:text.index(remove_after)]       
    text = text.replace('\n','')
    length = 0
    while len(text) != length:
        length = len(text)
        text = text.replace('<br>','<br/>')
        text = text.replace('<br/><br/>','<br/>')
    return {'content':text, 'link':link, 'title':title}