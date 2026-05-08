from rest_framework import serializers
from django.db.models import Sum
from .models import Commune


class CommuneSerializer(serializers.ModelSerializer):
    budget_depense_fcfa = serializers.SerializerMethodField()
    score_transparence = serializers.SerializerMethodField()

    class Meta:
        model = Commune
        fields = [
            "id", "code", "nom", "region", "population", "superficie_km2",
            "budget_annuel_fcfa", "maire_nom", "is_active",
            "budget_depense_fcfa", "score_transparence",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_budget_depense_fcfa(self, obj):
        val = getattr(obj, "_budget_depense", None)
        if val is not None:
            return int(val)
        from ..transactions.models import Transaction, TransactionStatut, TransactionType
        result = Transaction.objects.filter(
            commune=obj,
            statut=TransactionStatut.VALIDE,
            type=TransactionType.DEPENSE,
        ).aggregate(total=Sum("montant_fcfa"))
        return int(result["total"] or 0)

    def get_score_transparence(self, obj):
        """
        Calcul du score de transparence (sur 100 points) :
        transparency_score = (transactions_validées / total_transactions) * 100
        Arrondi à 1 décimale, défaut 0.0 si aucune transaction.
        """
        from ..transactions.models import Transaction, TransactionStatut
        txs = Transaction.objects.filter(commune=obj)
        total_count = txs.count()
        if total_count == 0:
            return 0.0

        val_count = txs.filter(statut=TransactionStatut.VALIDE).count()
        score = (val_count / total_count) * 100
        return round(score, 1)


