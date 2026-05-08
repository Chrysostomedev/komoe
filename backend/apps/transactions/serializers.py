from rest_framework import serializers
from .models import Transaction, TransactionStatut
from ..users.serializers import UserSerializer
from ..communes.serializers import CommuneSerializer


class TransactionSerializer(serializers.ModelSerializer):
    soumis_par_detail = UserSerializer(source="soumis_par", read_only=True)
    valide_par_detail = UserSerializer(source="valide_par", read_only=True)
    commune_detail = CommuneSerializer(source="commune", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id", "commune", "commune_detail", "type", "statut",
            "montant_fcfa", "categorie", "description", "periode",
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
            "description", "periode", "ipfs_hash", "blockchain_tx_hash_soumission"
        ]

    def validate_montant_fcfa(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif.")
        return value

    def validate_categorie(self, value):
        from .models import CategorieDepense
        if not value:
            return CategorieDepense.AUTRE
        # Nettoyer et normaliser
        v = str(value).strip().upper()
        if "INFRA" in v:
            return CategorieDepense.INFRASTRUCTURE
        if "SANT" in v or "HEALTH" in v:
            return CategorieDepense.SANTE
        if "EDUC" in v:
            return CategorieDepense.EDUCATION
        if "EAU" in v or "WATER" in v or "ASS" in v:
            return CategorieDepense.EAU_ASSAINISSEMENT
        if "SEC" in v:
            return CategorieDepense.SECURITE
        if "ADMIN" in v:
            return CategorieDepense.ADMINISTRATION
        if "AGRI" in v:
            return CategorieDepense.AGRICULTURE
        if "CULT" in v or "SPORT" in v:
            return CategorieDepense.CULTURE_SPORT

        valid_choices = [c[0] for c in CategorieDepense.choices]
        if v in valid_choices:
            return v

        return CategorieDepense.AUTRE

    def create(self, validated_data):
        validated_data["soumis_par"] = self.context["request"].user
        # Par défaut, une nouvelle transaction est un BROUILLON
        validated_data["statut"] = TransactionStatut.BROUILLON
        return super().create(validated_data)



class SignalementSerializer(serializers.ModelSerializer):
    commune_detail = CommuneSerializer(source="commune", read_only=True)
    auteur_detail = UserSerializer(source="auteur", read_only=True)

    class Meta:
        from .models import Signalement
        model = Signalement
        fields = [
            "id", "commune", "commune_detail", "sujet", "description",
            "auteur", "auteur_detail", "is_reviewed", "created_at"
        ]
        read_only_fields = ["id", "auteur", "is_reviewed", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["auteur"] = request.user
        return super().create(validated_data)

