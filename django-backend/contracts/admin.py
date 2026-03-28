from django.contrib import admin

from .models import ContractConsent, QardHasanContract


class ContractConsentInline(admin.TabularInline):
    model = ContractConsent
    extra = 0
    readonly_fields = ["user", "role", "consented_at", "ip_address", "user_agent"]


@admin.register(QardHasanContract)
class QardHasanContractAdmin(admin.ModelAdmin):
    list_display = ["id", "campaign", "borrower", "status", "amount_cents", "currency", "created_at"]
    list_filter = ["status", "currency"]
    search_fields = ["campaign__title_public", "borrower__email"]
    readonly_fields = ["contract_hash", "created_at", "updated_at"]
    inlines = [ContractConsentInline]


@admin.register(ContractConsent)
class ContractConsentAdmin(admin.ModelAdmin):
    list_display = ["id", "contract", "user", "role", "consented_at"]
    list_filter = ["role"]
    search_fields = ["user__email"]
