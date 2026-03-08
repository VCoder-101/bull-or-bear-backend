import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Периодические задачи
app.conf.beat_schedule = {
    # Обновлять свечи каждую минуту
    'update-candles-every-minute': {
        'task': 'market.update_candles',
        'schedule': 60.0,
    },
}
