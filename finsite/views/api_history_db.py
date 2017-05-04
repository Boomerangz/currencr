from datetime import datetime, timedelta

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, APIException
from finsite.models import Currency, CurrencyHistoryRecord

@api_view(['GET'])
def get_stock_history_from_db(request, code):
    if request.method == 'GET':
        try:
            currency = Currency.objects.get(code=code)
        except:
            raise NotFound() 
# date =        
        count = request.GET.get('count')

        currency_history_items = CurrencyHistoryRecord.objects.\
            filter(currency=currency).order_by('-time')

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
        
        if count is not None:
            try:
                count = int(count)
            except:
                raise APIException(detail="Count must be integer")

            currency_history_items = list(currency_history_items)
            if count > 0 and len(currency_history_items) > count:
                l = len(currency_history_items)
                c = count - 1
                removing_coof = int(l / c)
                if removing_coof > 1:
                    currency_history_items = [currency_history_items[i] for i in range(0, l) if i % removing_coof == 0 or i == l-1]
                if len(currency_history_items) > count:
                    from random import shuffle
                    shuffle(currency_history_items)                    
                    currency_history_items = sorted(currency_history_items[:count], key=lambda k: k.time)
                    
        return Response([{'price':h.price, 'date':h.time.strftime('%Y-%m-%d %H:%M')} for h in currency_history_items], headers={'Access-Control-Allow-Origin':'*'})