from datetime import datetime, timedelta

from rest_framework.decorators import api_view
from rest_framework.response import Response
from yahoo_finance import Share
from finsite.models import Currency
from forex_python.converter import CurrencyRates

@api_view(['GET'])
def get_stock_history(request, code):
    if request.method == 'GET':
        # print(Currency.objects.filter(url_code__iexact=code).query)
        currency = Currency.objects.get(url_code__iexact=code)
        date1 = request.GET.get('from', '2016-04-01')
        date2 = request.GET.get('to', '2020-05-01')
        if currency.exchange == 0:
            date1 = datetime.strptime(date1, '%Y-%m-%d')
            date2 = datetime.strptime(date2, '%Y-%m-%d')
            params = currency.code.split('-')

            history = [{
                        'price': get_currencies_date(*params, date),
                        'date': date.strftime('%Y-%m-%d')
                        }
                       for date in get_date_list(date1, date2)]
            return Response(history)
        elif currency.exchange > 1:
            yahoo = Share(currency.get_stock_identifier())
            history = yahoo.get_historical(date1, date2)
            history = map(lambda x: {'price': x['Close'], 'date': x['Date'], }, history)
            return Response(history, headers={'Access-Control-Allow-Origin':'*'})
        elif currency.code == 'BTC':
            return Response([], headers={'Access-Control-Allow-Origin':'*'})
            # return {'code':self.code, 'price':Bitfinex().get_current_price()}

        return Response([])

c = CurrencyRates()
memo = {}
def get_currencies_date(cur1, cur2, date):
    key = "%s-%s-%s" % (cur1, cur2, date.strftime('%Y-%m-%d'))
    if not key in memo:
        value = c.get_rate(cur1, cur2, date)
        memo[key] = value
        return value
    else:
        return memo[key]


def get_date_list(till, to):
    delta = to - till  # timedelta

    for i in range(delta.days + 1):
        yield (till + timedelta(days=i))