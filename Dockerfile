FROM python:3
WORKDIR /usr/src/app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "import nltk; nltk.download('all')"
COPY . .
CMD [ "uwsgi","--http",":8000","--threads","2","-w","finsite.wsgi"]
#CMD [ "celery","-A","finsite","worker","-B","--concurrency=2","-l","info"]

