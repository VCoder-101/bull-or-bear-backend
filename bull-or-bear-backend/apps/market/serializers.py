from rest_framework import serializers

from .models import Candle


class CandleSerializer(serializers.ModelSerializer):
    # open_time отдаём как Unix timestamp в миллисекундах (формат lightweight-charts)
    time = serializers.SerializerMethodField()

    class Meta:
        model = Candle
        fields = ['time', 'open', 'high', 'low', 'close', 'volume']

    def get_time(self, obj):
        return int(obj.open_time.timestamp())
