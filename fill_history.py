from finsite.models import Currency, CurrencyHistoryRecord
import requests
from datetime import datetime

delete_previous_history=True

url_template = "https://min-api.cryptocompare.com/data/histominute?fsym=%s&tsym=USD&limit=2000&aggregate=1&e=Kraken"


for curr in Currency.objects.all().filter(code='XRP'):
    if delete_previous_history:
        CurrencyHistoryRecord.objects.filter(currency=curr).delete()
    toTs = None
    while True:
        url = url_template % curr.code
        if toTs is not None:
            url += "&toTs=%d" % toTs
        print(url)
        r = requests.get(url)
        parsed_data = r.json()
        if len(parsed_data.get("Data",[])) == 0:
            break
        toTs = parsed_data["TimeFrom"] - 1
        print(toTs)
        history_records = [CurrencyHistoryRecord(exchange='Kraken', currency=curr, price=d["close"], volume=d["volumeto"], time=datetime.fromtimestamp(d["time"]))
        for d in parsed_data["Data"]]
        print("start bulk create")
        CurrencyHistoryRecord.objects.bulk_create(history_records)
        print("finished bulk create")
        print(curr.code, toTs, len(parsed_data["Data"]))
