import feedparser
from django.utils import translation
from django.views.generic import TemplateView

from finsite.models import Currency, Exchange, CurrencyHistoryRecord
from finsite.views.api_history_db import timeframe_filter_params


class CurrencyView(TemplateView):
    template_name = 'currency.html'

    def get_context_data(self, code, **kwargs):
        context = super(CurrencyView, self).get_context_data(**kwargs)
        currency = Currency.objects.get(url_code__iexact=code)
        exchange = None
        if 'exchange' in self.request.GET:
            try:
                exchange = Exchange.objects.get(name__iexact=self.request.GET['exchange'])
            except:
                pass
        exchange = exchange or currency.selected_exchange
        currency.selected_exchange = exchange
        currency.current_price = CurrencyHistoryRecord.objects.filter(currency=currency, exchange=exchange).order_by('-time')[0].price
        context['currency'] = currency
        context['quote'] = self.request.GET.get('quote', 'USD')
        context['timeframe'] = self.request.GET.get('timeframe', 'fiveminute')
        context['timeframes'] = timeframe_filter_params.keys()
        return context