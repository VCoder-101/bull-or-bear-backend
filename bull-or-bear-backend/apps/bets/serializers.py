from rest_framework import serializers

from .models import Bet


class BetSerializer(serializers.ModelSerializer):
    payout = serializers.IntegerField(read_only=True)
    # Время в Unix ms для удобства фронтенда
    created_at_ts = serializers.SerializerMethodField()
    resolved_at_ts = serializers.SerializerMethodField()

    class Meta:
        model = Bet
        fields = [
            'id', 'symbol', 'direction', 'amount', 'duration',
            'status', 'open_price', 'close_price', 'payout',
            'created_at', 'created_at_ts', 'resolved_at', 'resolved_at_ts',
        ]
        read_only_fields = fields

    def get_created_at_ts(self, obj):
        return int(obj.created_at.timestamp() * 1000)

    def get_resolved_at_ts(self, obj):
        if obj.resolved_at:
            return int(obj.resolved_at.timestamp() * 1000)
        return None


class CreateBetSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=20)
    direction = serializers.ChoiceField(choices=['bull', 'bear'])
    amount = serializers.IntegerField(min_value=10)
    duration = serializers.ChoiceField(choices=[5, 15, 60])
