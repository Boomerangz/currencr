import docker
import requests
import time
import logging
import traceback

def restart():
	client = docker.from_env()
	lst = client.containers.list()
	container = client.containers.get('currrencr_server')
	logging.error(container)
	logging.error(container.restart())
	time.sleep(5)

logging.basicConfig(format = u'%(filename)s[LINE:%(lineno)d]# %(levelname)-8s [%(asctime)s]  %(message)s', level = logging.INFO)
while True:
	try:
		response = requests.get('https://ru.currencr.me/', timeout=20)
		time.sleep(50)
		if response.status_code != 200:
			logging.error(r.text, r.status_code)
			restart()
		else:
			logging.info('Everything is ok')
	except Exception as e:
		traceback.print_exc()
		restart()
