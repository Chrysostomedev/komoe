from rest_framework import serializers
from .models import Transaction, TransactionStatut, Signalement, PreuveSignalement, PropositionDepense, VoteProposition
from ..users.serializers import UserSerializer
from ..communes.serializers import CommuneSerializer


class TransactionBaseSerializer(serializers.ModelSerializer):
    """Base pour la validation du budget."""
    
    def validate_budget(self, commune, transaction_type, montant, exclude_id=None):
        """Vérifie si la dépense respecte le budget annuel de la commune."""
        if transaction_type == "DEPENSE":
            from django.db.models import Sum
            
            # Calcul de la consommation actuelle (Dépenses validées ou soumises)
            qs = Transaction.objects.filter(
                commune=commune,
                type="DEPENSE",
                statut__in=[TransactionStatut.SOUMIS, TransactionStatut.VALIDE]
            )
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
                
            conso = qs.aggregate(total=Sum("montant_fcfa"))["total"] or 0
            
            if conso + montant > commune.budget_annuel_fcfa:
                reste = commune.budget_annuel_fcfa - conso
                raise serializers.ValidationError({
                    "montant_fcfa": f"Dépassement de budget ! Budget annuel : {commune.budget_annuel_fcfa:,} FCFA. "
                                   f"Déjà consommé : {conso:,} FCFA. Crédits restants : {max(0, reste):,} FCFA. "
                                   f"Votre saisie ({montant:,} FCFA) dépasse la limite autorisée."
                })

    def validate(self, data):
        # Pour les mises à jour, on récupère l'instance
        instance = getattr(self, 'instance', None)
        request = self.context.get("request")
        user = request.user if request else None
        
        if not user:
            return data

        commune = getattr(instance, 'commune', user.commune)
        if not commune:
            raise serializers.ValidationError("Compte non rattaché à une commune.")

        # On récupère les valeurs
        t_type = data.get("type", getattr(instance, 'type', "DEPENSE"))
        montant = data.get("montant_fcfa", getattr(instance, 'montant_fcfa', 0))
        
        self.validate_budget(commune, t_type, montant, exclude_id=instance.id if instance else None)
        return data


class TransactionSerializer(TransactionBaseSerializer):
    soumis_par_detail = UserSerializer(source="soumis_par", read_only=True)
    valide_par_detail = UserSerializer(source="valide_par", read_only=True)
    commune_detail = CommuneSerializer(source="commune", read_only=True)
    projet_nom = serializers.ReadOnlyField(source="projet.nom")

    class Meta:
        model = Transaction
        fields = [
            "id", "commune", "commune_detail", "type", "statut",
            "montant_fcfa", "categorie", "description", "motif_rejet", "periode",
            "projet", "projet_nom",
            "ipfs_hash", "ipfs_url",
            "blockchain_tx_hash_soumission", "blockchain_tx_hash_validation",
            "blockchain_synced_at",
            "soumis_par", "soumis_par_detail",
            "valide_par", "valide_par_detail",
            "created_at", "updated_at", "validated_at",
        ]
        read_only_fields = [
            "id", "statut",
            "blockchain_tx_hash_soumission", "blockchain_tx_hash_validation",
            "blockchain_synced_at",
            "soumis_par", "valide_par",
            "created_at", "updated_at", "validated_at",
        ]


class TransactionCreateSerializer(TransactionBaseSerializer):
    categorie = serializers.CharField(required=False, allow_blank=True, default="AUTRE")

    class Meta:
        model = Transaction
        fields = [
            "id", "commune", "type", "montant_fcfa", "categorie", 
            "description", "periode", "ipfs_hash", "blockchain_tx_hash_soumission",
            "projet"
        ]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["soumis_par"] = user
        validated_data["statut"] = TransactionStatut.BROUILLON
        
        if user.commune:
            validated_data["commune"] = user.commune
            
        return super().create(validated_data)


# ─── Phase 3 Serializers ─────────────────────────────────────────────────────

class VoteSignalementSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import VoteSignalement
        model = VoteSignalement
        fields = ["id", "signalement", "citoyen", "verdict", "created_at"]
        read_only_fields = ["id", "citoyen", "created_at"]


class RapportPDFSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import RapportPDF
        model = RapportPDF
        fields = ["id", "commune", "periode", "fichier_pdf", "blockchain_hash_preuve", "created_at"]
        read_only_fields = ["id", "created_at"]


class SignalementSerializer(serializers.ModelSerializer):
    commune_detail = CommuneSerializer(source="commune", read_only=True)
    auteur_detail = UserSerializer(source="auteur", read_only=True)
    nb_preuves = serializers.SerializerMethodField()
    nb_votes = serializers.IntegerField(read_only=True)
    pct_credible = serializers.FloatField(read_only=True)

    class Meta:
        model = Signalement
        fields = [
            "id", "commune", "commune_detail", "sujet", "description", "transaction",
            "auteur", "auteur_detail", "is_reviewed", "nb_preuves", 
            "nb_votes", "pct_credible", "created_at"
        ]
        read_only_fields = ["id", "auteur", "is_reviewed", "nb_votes", "pct_credible", "created_at"]

    def get_nb_preuves(self, obj):
        return obj.preuves.count()

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["auteur"] = request.user
        instance = super().create(validated_data)
        if request and request.user and request.user.is_authenticated:
            user = request.user
            user.reputation_score = (user.reputation_score or 0) + 5
            user.save(update_fields=["reputation_score"])
        return instance


class PreuveSignalementSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import PreuveSignalement
        model = PreuveSignalement
        fields = ["id", "signalement", "ipfs_hash", "ipfs_url", "nom_fichier", "type_fichier", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class VotePropositionSerializer(serializers.ModelSerializer):
    citoyen_nom = serializers.CharField(source="citoyen.full_name", read_only=True)

    class Meta:
        model = VoteProposition
        fields = ["id", "proposition", "citoyen", "citoyen_nom", "type_vote", "created_at"]
        read_only_fields = ["id", "citoyen", "created_at"]


class PropositionSerializer(serializers.ModelSerializer):
    commune_detail = CommuneSerializer(source="commune", read_only=True)
    soumis_par_detail = UserSerializer(source="soumis_par", read_only=True)
    nb_soutiens = serializers.IntegerField(read_only=True)
    nb_oppositions = serializers.IntegerField(read_only=True)
    score_vote = serializers.IntegerField(read_only=True)
    pct_soutien = serializers.FloatField(read_only=True)
    mon_vote = serializers.SerializerMethodField()

    class Meta:
        model = PropositionDepense
        fields = [
            "id", "commune", "commune_detail", "titre", "description",
            "categorie", "budget_demande_fcfa",
            "soumis_par", "soumis_par_detail",
            "statut", "deadline_vote",
            "nb_soutiens", "nb_oppositions", "score_vote", "pct_soutien",
            "mon_vote",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "soumis_par", "statut", "created_at", "updated_at"]

    def get_mon_vote(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        vote = obj.votes.filter(citoyen=request.user).first()
        return vote.type_vote if vote else None

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["soumis_par"] = request.user
        instance = super().create(validated_data)
        if request and request.user.is_authenticated:
            user = request.user
            user.reputation_score = (user.reputation_score or 0) + 10
            user.save(update_fields=["reputation_score"])

        from .notifications import notify_commune_maire
        notify_commune_maire(
            commune=instance.commune,
            titre="Nouvelle Proposition Citoyenne 💡",
            message=f"Une nouvelle proposition de dépense '{instance.titre[:30]}' a été soumise par un citoyen.",
            type_notif="PROPOSITION"
        )
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Notification
        model = Notification
        fields = ["id", "titre", "message", "type_notif", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProjetTransactionSerializer(serializers.ModelSerializer):
    transaction_detail = TransactionSerializer(source="transaction", read_only=True)
    
    class Meta:
        from .models import ProjetTransaction
        model = ProjetTransaction
        fields = ["id", "projet", "transaction", "transaction_detail", "montant_attribue", "created_at"]
        read_only_fields = ["id", "created_at"]
