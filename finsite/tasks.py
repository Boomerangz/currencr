from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta

from finsite.models import Currency, CurrencyHistoryRecord


@periodic_task(run_every=timedelta(minutes=1))
def update_prices():
    for c in Currency.objects.all():
        try:
            price = c.data()['price']
            if abs(c.current_price - price) > 0.0001:
                c.previous_price = c.current_price
                c.current_price = c.data()['price']
                c.save()
                CurrencyHistoryRecord.objects.create(currency=c, price=c.current_price).save()
                print(c.code, c.current_price, 'updated')            
        except Exception as e:
            print(c.code, e)