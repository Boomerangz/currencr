#git stash && git pull
rm -rf ../currencr_static/
../venv/bin/python manage.py collectstatic
docker build -t boomerang/currencr .
docker rm -f server
docker rm -f celery
docker run --link some-redis:redis -p 8000:8000 --name server -d boomerang/currencr
docker run --link some-redis:redis  --name celery -d boomerang/currencr bash run_celery.sh

