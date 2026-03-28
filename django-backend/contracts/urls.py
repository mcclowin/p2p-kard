from django.urls import path

from .views import (
    AdminContractDetailView,
    AdminContractListView,
    ContractDetailView,
    ContractSignView,
)

urlpatterns = [
    path("contracts/<str:campaign_id>", ContractDetailView.as_view(), name="contract-detail"),
    path("contracts/<str:campaign_id>/sign", ContractSignView.as_view(), name="contract-sign"),
    path("admin/contracts", AdminContractListView.as_view(), name="admin-contract-list"),
    path("admin/contracts/<str:campaign_id>", AdminContractDetailView.as_view(), name="admin-contract-detail"),
]
