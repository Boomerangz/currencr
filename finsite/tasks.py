from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta
import decimal

from finsite.models import Currency, CurrencyHistoryRecord


@periodic_task(run_every=timedelta(minutes=1))
def update_prices():
    for c in Currency.objects.all():
        try:
            price = c.data()['price']
            if abs(c.current_price - decimal.Decimal(price)) > 0.0001:
                c.previous_price = c.current_price
                c.current_price = c.data()['price']
                c.save()
                volume = c.data().get('volume')
                CurrencyHistoryRecord.objects.create(currency=c, price=c.current_price,\
                                                     volume=volume).save()
                print(c.code, c.current_price, 'updated')
            else:
                print('NOT CHANGED', c.code, c.current_price, decimal.Decimal(price))
        except Exception as e:
            print(c.code, e)