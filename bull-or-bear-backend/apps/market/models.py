from django.db import models


class Candle(models.Model):
    symbol = models.CharField(max_length=20, db_index=True)
    interval = models.CharField(max_length=10)
    open_time = models.DateTimeField()
    open = models.DecimalField(max_digits=20, decimal_places=8)
    high = models.DecimalField(max_digits=20, decimal_places=8)
    low = models.DecimalField(max_digits=20, decimal_places=8)
    close = models.DecimalField(max_digits=20, decimal_places=8)
    volume = models.DecimalField(max_digits=30, decimal_places=8)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('symbol', 'interval', 'open_time')
        ordering = ['open_time']

    def __str__(self):
        return f"{self.symbol} {self.interval} @ {self.open_time}"
