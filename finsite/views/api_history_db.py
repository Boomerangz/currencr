from datetime import datetime, timedelta

from django.db.models import Sum, Avg
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, APIException
from finsite.models import Currency, CurrencyHistoryRecord



filter_params = {
    'minute' :  {'select': {'time':"date_trunc('minute', time)"}},
    'hour' :  {'select': {'time':"date_trunc('hour', time)"}},
    'day' : {'select': {'time':"date_trunc('day', time)"}},
}

@api_view(['GET'])
def get_stock_history_from_db(request, code):
    if request.method == 'GET':
        try:
            currency = Currency.objects.get(code__iexact=code)
        except:
            raise NotFound() 
# date =        
        period = request.GET.get('period', 'minute')

        currency_history_items = CurrencyHistoryRecord.objects.\
            filter(currency=currency).order_by('time')

        try:
            date_from = int(request.GET.get('from'))
            date_from = datetime.fromtimestamp(date_from / 1e3)
            currency_history_items = currency_history_items.filter(time__gte=date_from)
        except Exception as e:
            print(e)
            currency_history_items = currency_history_items.filter(time__gte=datetime.now()-timedelta(hours=1))

        try:
            date_to = int(request.GET.get('to'))
            date_to = datetime.fromtimestamp(date_to / 1e3)
            currency_history_items = currency_history_items.filter(time__lte=date_to)
        except Exception as e:
            print(e)

        if period in filter_params.keys():
            currency_history_items = currency_history_items.extra(**filter_params[period]).values("time").annotate(price=Avg('price'), volume=Sum('volume')) #   filter(check_func[period], currency_history_items)

        return Response([{'price':h['price'], 'date':h['time'].strftime('%Y-%m-%d %H:%M')} for h in currency_history_items], headers={'Access-Control-Allow-Origin':'*'})