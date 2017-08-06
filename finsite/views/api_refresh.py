from rest_framework.decorators import api_view
from rest_framework.response import Response
from yahoo_finance import Share
from finsite.models import Currency

@api_view(['GET'])
def get_stock_fresh(request, code):
    if request.method == 'GET':
        currency = Currency.objects.get(code__iexact=code)
        exchange_name = request.GET.get('exchange')
        return Response(currency.data(exchange_name=exchange_name), headers={'Access-Control-Allow-Origin':'*'})