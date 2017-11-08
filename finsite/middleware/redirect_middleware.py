from django.utils.translation import get_language
from django.shortcuts import redirect
from finsite import settings

class LocaleRedirectMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response
        # One-time configuration and initialization.

    def __call__(self, request):
        if request.META['HTTP_HOST'] == 'currencr.me' \
            and 'history' not in request.path_info and 'fresh' not in request.path_info:
            lang = get_language()
            return redirect("https://"+lang + ".currencr.me"+request.path)
        # Code to be executed for each request before
        # the view (and later middleware) are called.

        response = self.get_response(request)

        # Code to be executed for each request/response after
        # the view is called.
        return response



def languages_context_processor(request):
    return {'LANGUAGES':settings.LANGUAGES_SITES}
