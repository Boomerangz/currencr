from django.db import models
from yahoo_finance import Share
from exchanges.bitfinex import Bitfinex
from forex_python.converter import CurrencyRates, CurrencyCodes

class Currency(models.Model):
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=50)
    exchange = models.IntegerField(blank=False, null=False)
    description = models.TextField()


    def __unicode__(self):
        return self.code

    def data(self):
        if self.exchange == 0:
            return {'code':self.code, 'price':CurrencyRates().get_rate(*self.code.split('-'))}
        elif self.exchange > 1:
            yahoo_data = Share(self.get_stock_identifier())
            return {'code':self.code, 'price':yahoo_data.get_price()}
        elif self.code == 'BTC':
            return {'code':self.code, 'price':Bitfinex().get_current_price()}



    def money_symbol(self):
        if self.exchange == 1:
            return "$"
        elif self.exchange == 2:
            return "$"
        elif self.exchange == 3:
            return "£"
        elif self.exchange == 0:
            return CurrencyCodes().get_currency_name(self.code.split('-')[-1]) or self.code.split('-')[-1]
        else:
            return ""


    def get_stock_identifier(self):
        postfix = '.L' if self.exchange == 3 else ''
        return self.code + postfix