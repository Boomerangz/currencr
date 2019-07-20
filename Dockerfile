FROM python:3.6
WORKDIR /usr/src/app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
RUN python manage.py collectstatic 
CMD ls && bash run_server.sh

