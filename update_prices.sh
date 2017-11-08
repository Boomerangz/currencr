while :
do
	echo "from finsite.tasks import update_prices; update_prices()" | python manage.py shell
	sleep 50
done

