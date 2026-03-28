import logging

from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from campaigns.models import Campaign
from core.utils import parse_prefixed_uuid
from payments.models import Contribution, ContributionStatus

from .models import ContractConsent, ContractStatus, ConsentRole, QardHasanContract
from .serializers import (
    ContractDetailSerializer,
    ContractSignSerializer,
    ContractStatusSerializer,
)

logger = logging.getLogger(__name__)


class ContractDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=ContractDetailSerializer)
    def get(self, request, campaign_id):
        campaign_uuid = parse_prefixed_uuid("c", campaign_id)
        if campaign_uuid is None:
            return Response({"detail": "Invalid campaign id."}, status=status.HTTP_400_BAD_REQUEST)

        contract = get_object_or_404(
            QardHasanContract.objects.prefetch_related("consents"),
            campaign_id=campaign_uuid,
        )

        # Access check: borrower, contributor, or admin
        user = request.user
        is_borrower = contract.borrower_id == user.id
        is_admin = user.is_staff or user.is_superuser
        is_contributor = Contribution.objects.filter(
            campaign_id=campaign_uuid,
            contributor=user,
            status=ContributionStatus.PAID,
        ).exists()

        if not (is_borrower or is_contributor or is_admin):
            return Response({"detail": "Not authorised."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ContractDetailSerializer(contract)
        return Response({"contract": serializer.data})


class ContractSignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=ContractSignSerializer, responses=ContractDetailSerializer)
    def post(self, request, campaign_id):
        campaign_uuid = parse_prefixed_uuid("c", campaign_id)
        if campaign_uuid is None:
            return Response({"detail": "Invalid campaign id."}, status=status.HTTP_400_BAD_REQUEST)

        contract = get_object_or_404(QardHasanContract, campaign_id=campaign_uuid)

        # Only the borrower can sign
        if contract.borrower_id != request.user.id:
            return Response({"detail": "Only the borrower can sign."}, status=status.HTTP_403_FORBIDDEN)

        if contract.status != ContractStatus.GENERATED:
            return Response(
                {"detail": f"Contract is already {contract.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ContractSignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Record borrower consent
        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
        if ip and "," in ip:
            ip = ip.split(",")[0].strip()
        user_agent = request.META.get("HTTP_USER_AGENT", "")

        ContractConsent.objects.get_or_create(
            contract=contract,
            user=request.user,
            role=ConsentRole.BORROWER,
            defaults={"ip_address": ip, "user_agent": user_agent},
        )

        contract.status = ContractStatus.BORROWER_SIGNED
        contract.borrower_signed_at = timezone.now()
        contract.save(update_fields=["status", "borrower_signed_at", "updated_at"])

        # Re-fetch with consents
        contract = QardHasanContract.objects.prefetch_related("consents").get(id=contract.id)
        detail = ContractDetailSerializer(contract)
        return Response({"contract": detail.data})


class AdminContractListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(responses=ContractStatusSerializer(many=True))
    def get(self, request):
        contracts = QardHasanContract.objects.all()
        serializer = ContractStatusSerializer(contracts, many=True)
        return Response({"contracts": serializer.data})


class AdminContractDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(responses=ContractDetailSerializer)
    def get(self, request, campaign_id):
        campaign_uuid = parse_prefixed_uuid("c", campaign_id)
        if campaign_uuid is None:
            return Response({"detail": "Invalid campaign id."}, status=status.HTTP_400_BAD_REQUEST)

        contract = get_object_or_404(
            QardHasanContract.objects.prefetch_related("consents"),
            campaign_id=campaign_uuid,
        )
        serializer = ContractDetailSerializer(contract)
        return Response({"contract": serializer.data})
