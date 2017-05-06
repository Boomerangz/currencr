from django.views.generic import TemplateView

from finsite.models import Currency

class CurrencyView(TemplateView):
    template_name = 'currency_view.html'

    def get_context_data(self, code, **kwargs):
        context = super(CurrencyView, self).get_context_data(**kwargs)
        context['currency'] = Currency.objects.get(code__iexact=code)

        return context