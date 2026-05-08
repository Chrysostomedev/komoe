from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Role, Profession, PUBLIC_ROLES


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "nom", "prenom", "role", "profession", "password", "password_confirm",
                  "telephone", "media_organisation"]
        extra_kwargs = {
            "role": {"required": False},
            "profession": {"required": False},
        }

    def validate_role(self, value):
        if value not in PUBLIC_ROLES:
            raise serializers.ValidationError(
                "L'inscription libre est réservée aux citoyens. "
                "Les comptes institutionnels sont créés par la DGDDL."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        # Par défaut : rôle CITOYEN
        attrs.setdefault("role", Role.CITOYEN)
        # Si profession JOURNALISTE renseignée → on garde CITOYEN comme rôle
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    commune_nom = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "nom", "prenom", "full_name", "role", "profession",
            "commune", "commune_nom", "wallet_address", "is_blockchain_authorized",
            "telephone", "media_organisation", "journaliste_verifie",
            "email_verifie", "avatar", "reputation_score",
            "is_active", "date_joined",
        ]
        read_only_fields = [
            "id", "journaliste_verifie",
            "email_verifie", "reputation_score", "date_joined",
        ]

    def get_commune_nom(self, obj):
        return obj.commune.nom if obj.commune else None


class UserCreateByAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["email", "nom", "prenom", "role", "commune", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
