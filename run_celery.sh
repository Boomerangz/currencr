echo "yes" |celery -A finsite purge && celery -A finsite worker -B --concurrency=2 -l info
