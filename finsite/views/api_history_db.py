from datetime import datetime, timedelta

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, APIException
from finsite.models import Currency, CurrencyHistoryRecord



filter_params = {
    'hour' : {'time__minute':0},
    'day' : {'time__hour':0, 'time__minute':0},
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
            currency_history_items = currency_history_items.filter(**filter_params[period])#   filter(check_func[period], currency_history_items)

        return Response([{'price':h.price, 'date':h.time.strftime('%Y-%m-%d %H:%M')} for h in currency_history_items], headers={'Access-Control-Allow-Origin':'*'})