import feedparser
from django.db.models import Q, Avg, Sum
from django.views.generic import TemplateView

from finsite.models import Currency, CurrencyHistoryRecord
from finsite.views.news import get_news


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
        for c in currency_list:
            c.day_history = self.get_history_for_currency(c)
        context['news_list'] = get_news(search=search, limit=len(currency_list))
        context['currency_list'] = currency_list
        return context

    def get_history_for_currency(self, currency):
        return list(map(lambda c: c['price'], CurrencyHistoryRecord.objects.\
                filter(currency=currency).order_by('time') \
                                .extra(select= {'time':"date_trunc('hour', time)"}) \
                                .values("time") \
                                .annotate(price=Avg('price'), volume=Sum('volume'))))
