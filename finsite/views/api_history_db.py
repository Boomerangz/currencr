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

        date_from = request.GET.get('from', '2016-04-01')
        date_to = request.GET.get('to', '2016-05-01')
        date_from = datetime.strptime(date_from, '%Y-%m-%d')
        date_to = datetime.strptime(date_to, '%Y-%m-%d')

        count = request.GET.get('count')

        currency_history_items = list(CurrencyHistoryRecord.objects.\
            filter(currency=currency))
        print (currency_history_items)

        if count is not None:
            try:
                count = int(count)
            except:
                raise APIException(detail="Count must be integer")
            if count > 0 and len(currency_history_items) > count:
                l = len(currency_history_items)
                c = count
                removing_coof = int(1 / (1 - (float(c)/float(l))))
                if removing_coof > 1:
                    currency_history_items = [currency_history_items[i] for i in range(0, l) if i % removing_coof == 0]
        return Response([{'price':h.price, 'date':h.time.strftime('%Y-%m-%d %H:%M')} for h in currency_history_items])