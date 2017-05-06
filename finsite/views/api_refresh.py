from rest_framework.decorators import api_view
from rest_framework.response import Response
from yahoo_finance import Share
from finsite.models import Currency

@api_view(['GET'])
def get_stock_fresh(request, code):
    if request.method == 'GET':
        currency = Currency.objects.get(code__iexact=code)
        return Response(currency.data(), headers={'Access-Control-Allow-Origin':'*'})