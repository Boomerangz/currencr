from finsite.models import Currency, CurrencyHistoryRecord
import requests
from datetime import datetime, timedelta

url_template = "https://min-api.cryptocompare.com/data/histominute?fsym=%s&tsym=USD&limit=10&aggregate=1&e=Kraken"


for curr in Currency.objects.all():
    url = url_template % curr.code
    r = requests.get(url)
    parsed_data = r.json()
    for d in parsed_data["Data"]:
        histime = datetime.fromtimestamp(d["time"])
        if CurrencyHistoryRecord.objects.filter(time=histime, currency=curr).count()==0:
            CurrencyHistoryRecord.objects.create(currency=curr, price=d["close"], volume=d["volumeto"], time=histime)

    
    last_history = CurrencyHistoryRecord.objects.filter(currency=curr).order_by('-time').first()
    days_ago = CurrencyHistoryRecord.objects.filter(time__lte=datetime.now()-timedelta(days=1), currency=curr).order_by('-id').first()
    if days_ago is not None:
        curr.price = last_history.price
        curr.previous_price = days_ago.price
        curr.save()
