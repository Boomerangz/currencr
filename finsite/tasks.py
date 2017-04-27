from celery import shared_task
from celery.task import periodic_task
from datetime import timedelta

from finsite.models import Currency


@periodic_task(run_every=timedelta(minutes=1))
def update_prices():
    for c in Currency.objects.all():
        try:
            c.previous_price = c.current_price
            c.current_price = c.data()['price']
            c.save()
            print(c.code, c.current_price, 'updated')
        except Exception as e:
            print(c.code, e)