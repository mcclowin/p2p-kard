import secrets

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.utils import parse_prefixed_uuid, prefixed_id

from .emails import (
    send_contact_details_to_lender,
    send_contact_request_to_endorser,
    send_endorsement_invite,
)
from .models import (
    ContactRequestStatus,
    Endorsement,
    EndorsementStatus,
    EndorserContactRequest,
)
from .serializers import (
    EndorsementCompleteSerializer,
    EndorsementCreateSerializer,
    EndorsementDetailSerializer,
    EndorsementPublicSerializer,
)


class InviteEndorserView(APIView):
    """POST — borrower invites an endorser by email."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EndorsementCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        borrow_request_id = request.data.get("borrow_request_id") or request.data.get("borrowRequestId")
        if not borrow_request_id:
            return Response({"detail": "borrow_request_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        from borrow.models import BorrowRequest

        br_uuid = parse_prefixed_uuid("br", borrow_request_id)
        if br_uuid is None:
            return Response({"detail": "Invalid borrow request id."}, status=status.HTTP_400_BAD_REQUEST)

        borrow_request = get_object_or_404(BorrowRequest, id=br_uuid, requester=request.user)

        invite_token = secrets.token_urlsafe(48)

        endorsement = Endorsement.objects.create(
            borrow_request=borrow_request,
            invite_email=serializer.validated_data["invite_email"],
            invite_token=invite_token,
            status=EndorsementStatus.INVITED,
        )

        send_endorsement_invite(endorsement)

        return Response(
            {
                "endorsement": {
                    "id": prefixed_id("end", endorsement.id),
                    "inviteToken": invite_token,
                }
            },
            status=status.HTTP_201_CREATED,
        )


class EndorsementDetailView(APIView):
    """GET — public, get endorsement by invite_token."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, invite_token):
        endorsement = get_object_or_404(Endorsement, invite_token=invite_token)
        br = endorsement.borrow_request

        data = EndorsementDetailSerializer(
            {
                "id": prefixed_id("end", endorsement.id),
                "status": endorsement.status,
                "borrow_request_title": br.title,
                "borrow_request_category": br.category,
                "borrow_request_amount_cents": br.amount_requested_cents or 0,
                "endorser_name": endorsement.endorser_name,
                "endorser_title": endorsement.endorser_title,
                "endorser_affiliation": endorsement.endorser_affiliation,
                "vouch_text": endorsement.vouch_text,
            }
        ).data

        return Response({"endorsement": data})


class CompleteEndorsementView(APIView):
    """POST — endorser fills in their vouch via invite_token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, invite_token):
        endorsement = get_object_or_404(Endorsement, invite_token=invite_token)

        if endorsement.status == EndorsementStatus.COMPLETED:
            return Response({"detail": "This endorsement has already been completed."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EndorsementCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        endorsement.endorser = request.user
        endorsement.endorser_name = serializer.validated_data["endorser_name"]
        endorsement.endorser_title = serializer.validated_data.get("endorser_title", "")
        endorsement.endorser_affiliation = serializer.validated_data.get("endorser_affiliation", "")
        endorsement.vouch_text = serializer.validated_data["vouch_text"]
        endorsement.contact_method = serializer.validated_data.get("contact_method", "")
        endorsement.contact_value = serializer.validated_data.get("contact_value", "")
        endorsement.status = EndorsementStatus.COMPLETED
        endorsement.completed_at = timezone.now()
        endorsement.save()

        return Response({"ok": True, "endorsement": EndorsementPublicSerializer(endorsement).data})


class EndorsementByBorrowRequestView(APIView):
    """GET — public, get completed endorsements for a borrow request."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, borrow_request_id):
        br_uuid = parse_prefixed_uuid("br", borrow_request_id)
        if br_uuid is None:
            return Response({"detail": "Invalid borrow request id."}, status=status.HTTP_400_BAD_REQUEST)

        endorsements = Endorsement.objects.filter(
            borrow_request_id=br_uuid, status=EndorsementStatus.COMPLETED
        ).order_by("-completed_at")

        return Response({"endorsements": EndorsementPublicSerializer(endorsements, many=True).data})


class RequestEndorserContactView(APIView):
    """POST — lender requests endorser's contact details."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, endorsement_id):
        end_uuid = parse_prefixed_uuid("end", endorsement_id)
        if end_uuid is None:
            return Response({"detail": "Invalid endorsement id."}, status=status.HTTP_400_BAD_REQUEST)

        endorsement = get_object_or_404(
            Endorsement, id=end_uuid, status=EndorsementStatus.COMPLETED
        )

        # Prevent duplicate pending requests
        existing = EndorserContactRequest.objects.filter(
            endorsement=endorsement,
            requester=request.user,
            status=ContactRequestStatus.PENDING,
        ).first()
        if existing:
            return Response(
                {"detail": "You already have a pending contact request for this endorser."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contact_request = EndorserContactRequest.objects.create(
            endorsement=endorsement,
            requester=request.user,
            status=ContactRequestStatus.PENDING,
        )

        send_contact_request_to_endorser(contact_request)

        return Response(
            {"contactRequest": {"id": prefixed_id("cr", contact_request.id), "status": contact_request.status}},
            status=status.HTTP_201_CREATED,
        )


class RespondContactRequestView(APIView):
    """POST — endorser approves/declines a contact request (via token in email)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, request_id):
        cr_uuid = parse_prefixed_uuid("cr", request_id)
        if cr_uuid is None:
            return Response({"detail": "Invalid contact request id."}, status=status.HTTP_400_BAD_REQUEST)

        contact_request = get_object_or_404(EndorserContactRequest, id=cr_uuid)

        if contact_request.status != ContactRequestStatus.PENDING:
            return Response({"detail": "This request has already been responded to."}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get("action")
        if action not in ("approve", "decline"):
            return Response({"detail": "action must be 'approve' or 'decline'."}, status=status.HTTP_400_BAD_REQUEST)

        contact_request.responded_at = timezone.now()

        if action == "approve":
            contact_request.status = ContactRequestStatus.APPROVED
            contact_request.save()
            send_contact_details_to_lender(contact_request)
            return Response({"ok": True, "status": "APPROVED"})
        else:
            contact_request.status = ContactRequestStatus.DECLINED
            contact_request.save()
            return Response({"ok": True, "status": "DECLINED"})
