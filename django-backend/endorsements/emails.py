import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

FROM_EMAIL = "noreply@handup.app"


def _get_frontend_url():
    """Return the frontend base URL from settings or a sensible default."""
    return getattr(settings, "FRONTEND_URL", "https://handup.app")


def send_endorsement_invite(endorsement):
    """Email the invited endorser with the link to vouch."""
    frontend = _get_frontend_url()
    link = f"{frontend}/app/endorse/{endorsement.invite_token}"
    subject = "You've been invited to endorse a loan request on HandUp"
    body = (
        f"Assalamu Alaikum,\n\n"
        f"Someone you know has requested a Qard Hasan (interest-free loan) on HandUp "
        f"and has asked you to endorse their request.\n\n"
        f"Your endorsement helps potential lenders trust the borrower. "
        f"You can review the request and submit your endorsement here:\n\n"
        f"{link}\n\n"
        f"If you don't know this person or don't wish to endorse, you can simply ignore this email.\n\n"
        f"JazakAllah Khair,\nThe HandUp Team"
    )
    try:
        send_mail(subject, body, FROM_EMAIL, [endorsement.invite_email], fail_silently=False)
    except Exception:
        logger.exception("Failed to send endorsement invite email to %s", endorsement.invite_email)


def send_contact_request_to_endorser(contact_request):
    """Email the endorser asking them to approve sharing their contact details."""
    endorsement = contact_request.endorsement
    frontend = _get_frontend_url()
    approve_link = f"{frontend}/app/endorse/{endorsement.invite_token}?respond={contact_request.id}&action=approve"
    decline_link = f"{frontend}/app/endorse/{endorsement.invite_token}?respond={contact_request.id}&action=decline"

    requester_email = contact_request.requester.email
    subject = "A potential lender wants to contact you — HandUp"
    body = (
        f"Assalamu Alaikum {endorsement.endorser_name},\n\n"
        f"A potential lender ({requester_email}) would like to reach out to you "
        f"regarding the endorsement you provided on HandUp.\n\n"
        f"If you're happy to share your contact details, click here:\n"
        f"{approve_link}\n\n"
        f"If you'd prefer not to, click here:\n"
        f"{decline_link}\n\n"
        f"JazakAllah Khair,\nThe HandUp Team"
    )
    recipient = endorsement.contact_value if endorsement.contact_method == "email" else endorsement.invite_email
    try:
        send_mail(subject, body, FROM_EMAIL, [recipient], fail_silently=False)
    except Exception:
        logger.exception("Failed to send contact request email to endorser %s", endorsement.id)


def send_contact_details_to_lender(contact_request):
    """Email the lender with the endorser's contact info after approval."""
    endorsement = contact_request.endorsement
    subject = "Endorser contact details — HandUp"
    body = (
        f"Assalamu Alaikum,\n\n"
        f"Great news! The endorser {endorsement.endorser_name} has approved sharing "
        f"their contact details with you.\n\n"
        f"Name: {endorsement.endorser_name}\n"
        f"Title: {endorsement.endorser_title}\n"
        f"Affiliation: {endorsement.endorser_affiliation}\n"
        f"Contact method: {endorsement.contact_method}\n"
        f"Contact: {endorsement.contact_value}\n\n"
        f"Please be respectful when reaching out.\n\n"
        f"JazakAllah Khair,\nThe HandUp Team"
    )
    try:
        send_mail(subject, body, FROM_EMAIL, [contact_request.requester.email], fail_silently=False)
    except Exception:
        logger.exception("Failed to send contact details to lender %s", contact_request.requester.id)
