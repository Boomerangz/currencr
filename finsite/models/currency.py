import decimal
import json

import requests
from django.db import models
from yahoo_finance import Share
from coinmarketcap import Market
coinmarketcap = Market()
from forex_python.converter import CurrencyRates, CurrencyCodes

class Currency(models.Model):
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=50)
    exchange = models.IntegerField(blank=False, null=False)
    description = models.TextField()

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
            return (self.previous_price - self.current_price) / self.previous_price
        return 0

    def data(self):
        if self.exchange == 0:
            return {'code':self.code, 'price':CurrencyRates().get_rate(*self.code.split('-'))}
        elif self.exchange > 1:
            yahoo_data = Share(self.get_stock_identifier())
            return {'code':self.code, 'price':yahoo_data.get_price()}
        elif self.exchange == 1:
            price = get_btc_e_ticker(self.code)
            return {'code':self.code, 'price':price}



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

def get_btc_e_ticker(currency):
    code = '%s_usd'%(currency.lower())
    r = requests.get('https://btc-e.nz/api/3/ticker/'+code)
    return (r.json()[code]['buy'] + r.json()[code]['sell']) / 2
