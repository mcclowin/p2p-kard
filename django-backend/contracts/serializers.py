from rest_framework import serializers

from core.serializers import CamelCaseSerializerMixin
from core.utils import prefixed_id

from .models import ContractConsent, QardHasanContract


class ContractConsentSerializer(CamelCaseSerializerMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = ContractConsent
        fields = ["id", "role", "consented_at"]

    def get_id(self, obj):
        return prefixed_id("cc", obj.id)


class ContractDetailSerializer(CamelCaseSerializerMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    campaign_id = serializers.SerializerMethodField()
    consents = ContractConsentSerializer(many=True, read_only=True)

    class Meta:
        model = QardHasanContract
        fields = [
            "id",
            "campaign_id",
            "contract_text",
            "contract_hash",
            "amount_cents",
            "currency",
            "repayment_date",
            "status",
            "borrower_signed_at",
            "created_at",
            "updated_at",
            "consents",
        ]

    def get_id(self, obj):
        return prefixed_id("qh", obj.id)

    def get_campaign_id(self, obj):
        return prefixed_id("c", obj.campaign_id)


class ContractStatusSerializer(CamelCaseSerializerMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    campaign_id = serializers.SerializerMethodField()

    class Meta:
        model = QardHasanContract
        fields = ["id", "campaign_id", "status", "amount_cents", "currency", "created_at"]

    def get_id(self, obj):
        return prefixed_id("qh", obj.id)

    def get_campaign_id(self, obj):
        return prefixed_id("c", obj.campaign_id)


class ContractSignSerializer(CamelCaseSerializerMixin, serializers.Serializer):
    consent_confirmed = serializers.BooleanField()

    def validate_consent_confirmed(self, value):
        if not value:
            raise serializers.ValidationError("You must confirm consent to sign the contract.")
        return value
