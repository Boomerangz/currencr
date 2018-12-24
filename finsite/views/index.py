from datetime import datetime, timedelta
from django.db.models import Q, Avg, Sum
from django.views.generic import TemplateView
from django.core.cache import cache
from finsite.models import Exchange, Currency, CurrencyHistoryRecord
from django.utils import translation
from timeit import default_timer as timer

default_quotes = ["BTC", "ETH"]

period_param = {
    '1d' : 24,
    '1w' : 168,
    '1m' : 720
}

cache_param = {
    '1d' : 60 * 5,
    '1w' : 60 * 60 * 6,
    '1m' : 60 * 60 * 24
}

class IndexView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)

        period = self.request.GET.get('period', '1w')
        if not period in period_param.keys():
            period = "1w"
        
        exchange = Exchange.objects.filter()[:1].get().name
        exchange = Exchange.objects.get(name__iexact=self.request.GET.get('exchange', exchange))

        list_data = self.get_currency_list_data(exchange, period)
        
        context['period'] = period
        context['periods'] = period_param.keys()
        context['currency_list'] = list_data['currency_list']
        context['quote_list'] = list_data['quote_list']
        context['exchange'] = exchange

        return context
    
    def get_currency_list_data(self, exchange, period):
        from_time = datetime.now() - timedelta(hours=period_param[period])
        currency_list = Currency.objects.all().order_by('ordering', 'id')

        currency = {}
        for c in currency_list:
            c.selected_exchange = exchange
            key = c.code + c.selected_exchange.name + period
            c.USD = cache.get(key)
            if not c.USD:
                c.USD = self.get_history_for_currency(c, from_time=from_time)
                cache.set(key, c.USD, cache_param[period])
            c.current_price = CurrencyHistoryRecord.objects.filter(currency=c, exchange=exchange).order_by('-time').first().price
            currency[c.code] = c.USD

        quote_list = Currency.objects.filter(code__in=default_quotes)
        for q in quote_list:
            q.USD = currency[q.code]
        
        return {
            'currency_list': currency_list,
            'quote_list': quote_list
        }

    def get_history_for_currency(self, currency, from_time=None):
        if not from_time:
            from_time = datetime.now() - timedelta(hours=24)
        return list(map(lambda c: c['price'], CurrencyHistoryRecord.objects.\
                filter(currency=currency, time__gte=from_time, exchange=currency.selected_exchange).order_by('time') \
                                .extra(select= {'time':"date_trunc('hour', time)"}) \
                                .values("time") \
                                .annotate(price=Avg('price'), volume=Sum('volume'))))
