import json
from datetime import datetime, timedelta

from django.db.models import Sum, Avg
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, APIException
from finsite.models import Currency, CurrencyHistoryRecord, Exchange
from django.http import HttpResponse



timeframe_filter_params = {
    'minute' :  {'select': {'time':"date_trunc('minute', time)"}},
    'fiveminute' :  {'select': {'time':"date_trunc('hour', time) + date_part('minute', time)::int / 5 * interval '5 min'"}},
    'fifteenminute' :  {'select': {'time':"date_trunc('hour', time) + date_part('minute', time)::int / 15 * interval '15 min'"}},
    'thirtyminutes' :  {'select': {'time':"date_trunc('hour', time) + date_part('minute', time)::int / 30 * interval '30 min'"}},
    'hour' :  {'select': {'time':"date_trunc('hour', time)"}},
    'day' : {'select': {'time':"date_trunc('day', time)"}},
}

def jsonify_generator(iterator):
    yield '['
    first = True
    for item in iterator:
        if not first:
            yield ','
        else:
            first = False
        yield json.dumps(item)
    yield ']'


@api_view(['GET'])
def get_stock_history_from_db(request, code):
    if request.method == 'GET':
        try:
            currency = Currency.objects.get(url_code__iexact=code)
        except:
            raise NotFound() 

        period = request.GET.get('period', 'minute')
        exchange = None
        if 'exchange' in request.GET:
            try:
                exchange = Exchange.objects.get(name__iexact=request.GET['exchange'])
            except:
                pass
        exchange = exchange or currency.selected_exchange


        currency_history_items = CurrencyHistoryRecord.objects.\
            filter(currency=currency, exchange=exchange).order_by('time')

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

        if period in timeframe_filter_params.keys():
            currency_history_items = currency_history_items.extra(**timeframe_filter_params[period]).values("time").annotate(price=Avg('price'), volume=Sum('volume')) #   filter(check_func[period], currency_history_items)
        response = HttpResponse(jsonify_generator(
                                        ({  'price' :h['price'],
                                            'volume':h['volume'],
                                            'date'  :h['time'].strftime('%Y-%m-%dT%H:%M:%SZ')
                                         }
                                            for h in currency_history_items.iterator()
                                         )
                                    )
                                )
        response['Access-Control-Allow-Origin'] = '*'
        return response