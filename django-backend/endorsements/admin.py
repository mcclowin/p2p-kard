from django.contrib import admin

from .models import Endorsement, EndorserContactRequest


@admin.register(Endorsement)
class EndorsementAdmin(admin.ModelAdmin):
    list_display = ("id", "borrow_request", "endorser_name", "status", "invite_email", "created_at")
    list_filter = ("status",)
    search_fields = ("endorser_name", "invite_email", "endorser_affiliation")
    readonly_fields = ("id", "invite_token", "created_at", "completed_at")


@admin.register(EndorserContactRequest)
class EndorserContactRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "endorsement", "requester", "status", "created_at")
    list_filter = ("status",)
    readonly_fields = ("id", "created_at", "responded_at")
