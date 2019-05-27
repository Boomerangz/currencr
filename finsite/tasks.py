import feedparser
from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta, datetime
import decimal
import requests
import pytz
from django.db.models import Q


from finsite.models import Currency, CurrencyHistoryRecord, Exchange

@periodic_task(run_every=timedelta(seconds=55))
def update_prices():
    url_template = "https://min-api.cryptocompare.com/data/histominute?fsym=%s&tsym=USD&limit=%d&aggregate=1&e=%s"
    for exc in Exchange.objects.all():        
        for curr in Currency.objects.filter(exchange_list__id=exc.id):
            last_time = CurrencyHistoryRecord.objects.filter(currency=curr, exchange=exc).order_by('-time').first()
            if last_time:
                last_time = last_time.time
                now = datetime.now()
                now = pytz.utc.localize(now)
                delta = (now - last_time).total_seconds()
                count = int(delta / 60) or 5
            else:
                count = 2000
            if count > 2000:
               count = 2000



            url = url_template % (curr.code, count, exc.name)
            print(url)
            r = requests.get(url, timeout=10)
            parsed_data = r.json()
            try:
             for d in parsed_data["Data"][:-1]:
                if (d.get("close", 0) or 0) < 0.00001:
                    break
                histime = datetime.fromtimestamp(d["time"])
                if CurrencyHistoryRecord.objects.filter(time=histime, currency=curr, exchange=exc).count()==0:
                    print(curr.code, d["close"], d["volumeto"], histime, exc)
                    CurrencyHistoryRecord.objects.create(currency=curr, price=d["close"], volume=d["volumeto"], time=histime, exchange=exc)
            except Exception as e:
              print(parsed_data)
              print(e)
            if exc == curr.selected_exchange:
                last_history = CurrencyHistoryRecord.objects.filter(currency=curr, exchange=exc).order_by('-time').first()
                days_ago = CurrencyHistoryRecord.objects.filter(time__lte=datetime.now()-timedelta(days=1), currency=curr, exchange=exc).order_by('-id').first()
                if days_ago is not None:
                    curr.current_price = last_history.price
                    curr.previous_price = days_ago.price
                curr.save()
