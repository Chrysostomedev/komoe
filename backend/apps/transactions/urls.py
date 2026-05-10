from django.urls import path
from .views import (
    TransactionListView,
    TransactionCommuneListView,
    TransactionCreateView,
    TransactionDetailView,
    valider_transaction,
    rejeter_transaction,
    confirmer_hash_soumission,
    creer_recette_brouillon,
    confirmer_recette,
    SignalementListCreateView,
    SignalementDetailView,
    ajouter_preuve_signalement,
    PropositionListCreateView,
    PropositionDetailView,
    voter_proposition,
    qr_code_transaction,
    generer_rapport_pdf,
    NotificationListView,
    marquer_notifs_lues,
    notifications_stream,
    voter_signalement,
    detecter_anomalies,
    open_data_stats,
    simuler_digest_mensuel,
    ProjetTransactionListView,
)

urlpatterns = [
    # ─── Transactions ──────────────────────────────────────────────────
    path("", TransactionListView.as_view(), name="transactions-list"),
    path("soumettre/", TransactionCreateView.as_view(), name="transactions-create"),
    path("recettes/", creer_recette_brouillon, name="recettes-create"),
    path("recettes/<uuid:pk>/confirmer/", confirmer_recette, name="recettes-confirmer"),
    path("<uuid:pk>/", TransactionDetailView.as_view(), name="transactions-detail"),
    path("<uuid:pk>/valider/", valider_transaction, name="transactions-valider"),
    path("<uuid:pk>/rejeter/", rejeter_transaction, name="transactions-rejeter"),
    path("<uuid:pk>/confirmer-hash/", confirmer_hash_soumission, name="transactions-confirmer-hash"),
    path("<uuid:pk>/qr/", qr_code_transaction, name="transactions-qr"),           # I4
    path("commune/<int:commune_id>/", TransactionCommuneListView.as_view(), name="transactions-commune"),
    path("anomalies/", detecter_anomalies, name="transactions-anomalies"),       # I3
    path("digest/simuler/", simuler_digest_mensuel, name="transactions-digest-simuler"), # I8
    path("projets/", ProjetTransactionListView.as_view(), name="projets-transactions"), # H11

    # ─── Open Data (I5) ────────────────────────────────────────────────
    path("open/stats/", open_data_stats, name="open-data-stats"),

    # ─── Rapports PDF (H9) ─────────────────────────────────────────────
    path("commune/<int:commune_id>/rapport/", generer_rapport_pdf, name="commune-rapport-pdf"),

    # ─── Signalements ──────────────────────────────────────────────────
    path("signalements/", SignalementListCreateView.as_view(), name="signalements-list-create"),
    path("signalements/<uuid:pk>/", SignalementDetailView.as_view(), name="signalements-detail"),
    path("signalements/<uuid:pk>/preuves/", ajouter_preuve_signalement, name="signalements-preuves"),  # H1
    path("signalements/<uuid:pk>/voter/", voter_signalement, name="signalements-voter"),              # H4

    # ─── Propositions & Votes (H3) ─────────────────────────────────────
    path("propositions/", PropositionListCreateView.as_view(), name="propositions-list-create"),
    path("propositions/<uuid:pk>/", PropositionDetailView.as_view(), name="propositions-detail"),
    path("propositions/<uuid:pk>/voter/", voter_proposition, name="propositions-voter"),

    # ─── Notifications (H10) ───────────────────────────────────────────
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/read/", marquer_notifs_lues, name="notifications-read"),
    path("notifications/stream/", notifications_stream, name="notifications-stream"),
]
