from django.db import models
from .currency import Currency
from .exchange import Exchange

class CurrencyHistoryRecord(models.Model):
    currency = models.ForeignKey(Currency)
    price = models.DecimalField(decimal_places=5, max_digits=15, default=0)
    time = models.DateTimeField()
    volume = models.FloatField(blank=True, null=True, default=None)
    exchange = models.ForeignKey(Exchange, default=1)
