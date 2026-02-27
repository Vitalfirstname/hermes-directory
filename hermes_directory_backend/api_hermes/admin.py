from django.contrib import admin
from .models import Office

@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('id', 'tower', 'number', 'owner', 'phone', 'website')
    list_per_page = 13

