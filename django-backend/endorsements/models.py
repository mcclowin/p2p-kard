import uuid

from django.conf import settings
from django.db import models


class EndorsementStatus(models.TextChoices):
    INVITED = "INVITED", "Invited"
    COMPLETED = "COMPLETED", "Completed"
    DECLINED = "DECLINED", "Declined"


class ContactRequestStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    DECLINED = "DECLINED", "Declined"


class Endorsement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    borrow_request = models.ForeignKey(
        "borrow.BorrowRequest", related_name="endorsements", on_delete=models.CASCADE
    )
    endorser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="endorsements_given",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    invite_token = models.CharField(max_length=64, unique=True)
    invite_email = models.EmailField()
    endorser_name = models.CharField(max_length=255, blank=True)
    endorser_title = models.CharField(max_length=255, blank=True)
    endorser_affiliation = models.CharField(max_length=255, blank=True)
    vouch_text = models.TextField(blank=True)
    contact_method = models.CharField(max_length=20, blank=True)
    contact_value = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20, choices=EndorsementStatus.choices, default=EndorsementStatus.INVITED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"Endorsement for {self.borrow_request_id} ({self.status})"


class EndorserContactRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    endorsement = models.ForeignKey(
        Endorsement, related_name="contact_requests", on_delete=models.CASCADE
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="endorser_contact_requests", on_delete=models.CASCADE
    )
    status = models.CharField(
        max_length=20, choices=ContactRequestStatus.choices, default=ContactRequestStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"ContactRequest {self.id} ({self.status})"
