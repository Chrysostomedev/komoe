from rest_framework import serializers
from .models import Transaction, TransactionStatut, Signalement, PreuveSignalement, PropositionDepense, VoteProposition
from ..users.serializers import UserSerializer
from ..communes.serializers import CommuneSerializer


class TransactionSerializer(serializers.ModelSerializer):
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


class TransactionCreateSerializer(serializers.ModelSerializer):
    categorie = serializers.CharField(required=False, allow_blank=True, default="AUTRE")

    class Meta:
        model = Transaction
        fields = [
            "id", "commune", "type", "montant_fcfa", "categorie", 
            "description", "periode", "ipfs_hash", "blockchain_tx_hash_soumission",
            "projet"
        ]

    def validate_montant_fcfa(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value

    def validate_categorie(self, value):
        from .models import CategorieDepense
        if not value:
            return CategorieDepense.AUTRE
        v = str(value).strip().upper()
        if "INFRA" in v: return CategorieDepense.INFRASTRUCTURE
        if "SANT" in v: return CategorieDepense.SANTE
        if "EDUC" in v: return CategorieDepense.EDUCATION
        if "EAU" in v: return CategorieDepense.EAU_ASSAINISSEMENT
        if "SEC" in v: return CategorieDepense.SECURITE
        if "ADMIN" in v: return CategorieDepense.ADMINISTRATION
        if "AGRI" in v: return CategorieDepense.AGRICULTURE
        if "CULT" in v: return CategorieDepense.CULTURE_SPORT
        return v if v in [c[0] for c in CategorieDepense.choices] else CategorieDepense.AUTRE

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["soumis_par"] = user
        validated_data["statut"] = TransactionStatut.BROUILLON
        # VITAL: Force the transaction's commune to be the user's assigned commune
        # This prevents an agent from Abobo from creating a transaction for Bassam.
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


# ─── H1 : Preuves signalement ────────────────────────────────────────────────

class PreuveSignalementSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import PreuveSignalement
        model = PreuveSignalement
        fields = ["id", "signalement", "ipfs_hash", "ipfs_url", "nom_fichier", "type_fichier", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


# ─── H3 : Propositions + Votes ───────────────────────────────────────────────

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


# ─── H10 : Notifications ─────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Notification
        model = Notification
        fields = ["id", "titre", "message", "type_notif", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]
