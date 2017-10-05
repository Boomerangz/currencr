FROM python:3
WORKDIR /usr/src/app
RUN pip install nltk==3.2.4
RUN python -c "import nltk; nltk.download('all')"
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ls && bash run_server.sh

