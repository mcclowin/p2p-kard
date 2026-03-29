from django.urls import path

from .views import (
    CompleteEndorsementView,
    EndorsementByBorrowRequestView,
    EndorsementDetailView,
    InviteEndorserView,
    RequestEndorserContactView,
    RespondContactRequestView,
)

urlpatterns = [
    path("endorsements/invite", InviteEndorserView.as_view(), name="endorsement-invite"),
    path("endorsements/by-request/<str:borrow_request_id>", EndorsementByBorrowRequestView.as_view(), name="endorsements-by-request"),
    path("endorsements/contact-requests/<str:request_id>/respond", RespondContactRequestView.as_view(), name="endorsement-contact-respond"),
    path("endorsements/<str:invite_token>", EndorsementDetailView.as_view(), name="endorsement-detail"),
    path("endorsements/<str:invite_token>/complete", CompleteEndorsementView.as_view(), name="endorsement-complete"),
    path("endorsements/<str:endorsement_id>/request-contact", RequestEndorserContactView.as_view(), name="endorsement-request-contact"),
]
