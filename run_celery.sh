echo "yes" |celery -A finsite purge -f && celery -A finsite worker -B --concurrency=2 -l info
