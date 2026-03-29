import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("borrow", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Endorsement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("invite_token", models.CharField(max_length=64, unique=True)),
                ("invite_email", models.EmailField(max_length=254)),
                ("endorser_name", models.CharField(blank=True, max_length=255)),
                ("endorser_title", models.CharField(blank=True, max_length=255)),
                ("endorser_affiliation", models.CharField(blank=True, max_length=255)),
                ("vouch_text", models.TextField(blank=True)),
                ("contact_method", models.CharField(blank=True, max_length=20)),
                ("contact_value", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(
                    choices=[("INVITED", "Invited"), ("COMPLETED", "Completed"), ("DECLINED", "Declined")],
                    default="INVITED",
                    max_length=20,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("borrow_request", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="endorsements",
                    to="borrow.borrowrequest",
                )),
                ("endorser", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="endorsements_given",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.CreateModel(
            name="EndorserContactRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(
                    choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("DECLINED", "Declined")],
                    default="PENDING",
                    max_length=20,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                ("endorsement", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="contact_requests",
                    to="endorsements.endorsement",
                )),
                ("requester", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="endorser_contact_requests",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        migrations.AddIndex(
            model_name="endorsement",
            index=models.Index(fields=["status"], name="endorsemen_status_idx"),
        ),
        migrations.AddIndex(
            model_name="endorsercontactrequest",
            index=models.Index(fields=["status"], name="endorsemen_cr_status_idx"),
        ),
    ]
