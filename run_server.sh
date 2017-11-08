gunicorn finsite.wsgi application -b 0.0.0.0:8000 -w 1 --timeout=60 --graceful-timeout=60 --max-requests=1024
