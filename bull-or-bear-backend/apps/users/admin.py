from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, UserProfile, VerificationCode


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_verified', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Verification', {'fields': ('is_verified',)}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'coins', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at')
    readonly_fields = ('created_at',)
