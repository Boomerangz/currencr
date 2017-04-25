from rest_framework.decorators import api_view
from rest_framework.response import Response
from yahoo_finance import Share
from finsite.models import Currency

@api_view(['GET'])
def get_stock_history(request, code):
    if request.method == 'GET':
        currency = Currency.objects.get(code=code)
        yahoo = Share(currency.get_stock_identifier())
        date1 = request.GET.get('from', '2016-04-01')
        date2 = request.GET.get('to', '2016-05-01')
        return Response(yahoo.get_historical(date1, date2))