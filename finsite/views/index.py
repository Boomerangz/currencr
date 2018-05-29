from datetime import datetime, timedelta

import feedparser
from django.db.models import Q, Avg, Sum
from django.views.generic import TemplateView

from finsite.models import Currency, CurrencyHistoryRecord
from finsite.views.news import get_news
from django.utils import translation

class IndexView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)

        search = self.request.GET.get('search')
        currency_list = Currency.objects.all().order_by('ordering', 'id')
        if search:
            currency_list = currency_list \
                .filter(Q(name__icontains=search)|Q(code__icontains=search))
        currency_list = list(currency_list)
        day_ago = datetime.now() - timedelta(hours=24)
        for c in currency_list:
            c.USD = self.get_history_for_currency(c, from_time=day_ago)
        quote_list = Currency.objects.filter(code__in = ["BTC", "ETH"])
        for q in quote_list:
            q.USD = self.get_history_for_currency(q, from_time=day_ago)
        news_list = list(get_news(limit=25, language=translation.get_language()))
        context['top_news_list'] = [n for n in news_list if n.image][:3]
        context['news_list'] = [n for n in news_list if n not in context['top_news_list']]
        context['currency_list'] = currency_list
        context['quote_list'] = quote_list
        context['exchange'] = 'Poloniex'
        return context

    def get_history_for_currency(self, currency, from_time=None):
        if not from_time:
            from_time = datetime.now() - timedelta(hours=24)
        return list(map(lambda c: c['price'], CurrencyHistoryRecord.objects.\
                filter(currency=currency, time__gte=from_time, exchange=currency.selected_exchange).order_by('time') \
                                .extra(select= {'time':"date_trunc('hour', time)"}) \
                                .values("time") \
                                .annotate(price=Avg('price'), volume=Sum('volume'))))
