import decimal
import json

import requests
from django.db import models
from .exchange import Exchange

PREDICTION_STATUS = (
    (0, 'Off'),
    (1, 'On'),
)

class Currency(models.Model):
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=50)
    url_code = models.CharField(max_length=10)



    exchange_list = models.ManyToManyField(Exchange, related_name='exchange_list')
    selected_exchange = models.ForeignKey(Exchange, default=1, on_delete=models.PROTECT)
    prediction_status = models.IntegerField(choices=PREDICTION_STATUS, default=0)

    ordering = models.IntegerField(default=1)

    current_price = models.DecimalField(decimal_places=5,max_digits=15, default=0)
    previous_price = models.DecimalField(decimal_places=5,max_digits=15, default=0)


    def __unicode__(self):
        return self.code

    def __str__(self):
        return self.code


    def up(self):
        return self.current_price > self.previous_price

    def down(self):
        return self.current_price < self.previous_price

    def percents(self):
        if self.previous_price != decimal.Decimal(0):
            return ((self.previous_price - self.current_price) / self.previous_price) * -100
        return 0

    def data(self, exchange_name=None):
        if exchange_name:
            exc = Exchange.objects.get(name__iexact=exchange_name)
        else:
            exc = self.selected_exchange
        price, volume = get_ticker(self, exc)
        return {'code':self.code, 'price':price, 'volume':volume}

    def get_stock_identifier(self):
        postfix = '.L' if self.exchange == 3 else ''
        return self.code + postfix

from finsite.models.currency_history_record	 import CurrencyHistoryRecord

def get_ticker(currency, exc):
    history_point = CurrencyHistoryRecord.objects.filter(currency=currency, exchange=exc).order_by('-time')[0]
    return history_point.price, history_point.volume
    #url = "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=%s&tsyms=USD&e=%s" % (currency.upper(), exchange_name)
    #r = requests.get(url)
    #parsed = r.json()["RAW"][currency.upper()]["USD"]
    #return parsed["PRICE"], parsed["LASTVOLUMETO"]
