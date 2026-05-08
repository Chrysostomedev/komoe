from django.urls import path
from .views import (
    TransactionListView,
    TransactionCommuneListView,
    TransactionCreateView,
    TransactionDetailView,
    valider_transaction,
    rejeter_transaction,
    confirmer_hash_soumission,
    SignalementListCreateView,
)

urlpatterns = [
    path("", TransactionListView.as_view(), name="transactions-list"),
    path("soumettre/", TransactionCreateView.as_view(), name="transactions-create"),
    path("<uuid:pk>/", TransactionDetailView.as_view(), name="transactions-detail"),
    path("<uuid:pk>/valider/", valider_transaction, name="transactions-valider"),
    path("<uuid:pk>/rejeter/", rejeter_transaction, name="transactions-rejeter"),
    path("<uuid:pk>/confirmer-hash/", confirmer_hash_soumission, name="transactions-confirmer-hash"),
    path("commune/<int:commune_id>/", TransactionCommuneListView.as_view(), name="transactions-commune"),
    path("signalements/", SignalementListCreateView.as_view(), name="signalements-list-create"),
]

