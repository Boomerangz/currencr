from django.views.generic import TemplateView

from finsite.models import Currency


class IndexView(TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        context['currency_list'] = Currency.objects.all()
        return context