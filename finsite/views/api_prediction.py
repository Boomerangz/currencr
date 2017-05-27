
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from finsite.models import CurrencyHistoryRecord, Currency
from datetime import datetime

@api_view(['GET'])
def get_prediction(request, code):
    try:
        currency = Currency.objects.get(code__iexact=code)
    except:
        raise NotFound()
    history = CurrencyHistoryRecord.objects.\
            filter(currency=currency).order_by('-time')[:200]

    history = sorted(list(history), key=lambda x:x.time)
    from_time = history[0].time

    import numpy as np
    from scipy import interpolate

    x = [(h.time-from_time).total_seconds()  for h in history]
    y = [h.price for h in history]
    f = interpolate.interp1d(x, y, fill_value='extrapolate')

    end_time = x[-1]

    return Response([{'price': f(x*60+end_time) } for x in range(60)],
        headers={'Access-Control-Allow-Origin': '*'})
