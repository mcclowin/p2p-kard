from rest_framework import serializers

from core.serializers import CamelCaseSerializerMixin
from core.utils import prefixed_id

from .models import Endorsement


class EndorsementPublicSerializer(CamelCaseSerializerMixin, serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = Endorsement
        fields = [
            "id",
            "endorser_name",
            "endorser_title",
            "endorser_affiliation",
            "vouch_text",
            "created_at",
        ]

    def get_id(self, obj):
        return prefixed_id("end", obj.id)


class EndorsementCreateSerializer(CamelCaseSerializerMixin, serializers.Serializer):
    invite_email = serializers.EmailField()


class EndorsementCompleteSerializer(CamelCaseSerializerMixin, serializers.Serializer):
    endorser_name = serializers.CharField(max_length=255)
    endorser_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    endorser_affiliation = serializers.CharField(max_length=255, required=False, allow_blank=True)
    vouch_text = serializers.CharField()
    contact_method = serializers.ChoiceField(choices=["email", "phone"], required=False)
    contact_value = serializers.CharField(max_length=255, required=False, allow_blank=True)


class EndorsementDetailSerializer(CamelCaseSerializerMixin, serializers.Serializer):
    """Returned when an endorser opens the invite link — shows borrow request summary."""
    id = serializers.CharField()
    status = serializers.CharField()
    borrow_request_title = serializers.CharField()
    borrow_request_category = serializers.CharField()
    borrow_request_amount_cents = serializers.IntegerField()
    endorser_name = serializers.CharField()
    endorser_title = serializers.CharField()
    endorser_affiliation = serializers.CharField()
    vouch_text = serializers.CharField()


class ContactRequestSerializer(CamelCaseSerializerMixin, serializers.Serializer):
    endorsement_id = serializers.CharField()
