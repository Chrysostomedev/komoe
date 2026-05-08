import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.TextChoices):
    AGENT_FINANCIER = "AGENT_FINANCIER", "Agent Financier"
    MAIRE = "MAIRE", "Maire / Conseil Municipal"
    DGDDL = "DGDDL", "DGDDL (Super Admin)"
    COUR_COMPTES = "COUR_COMPTES", "Cour des Comptes"
    BAILLEUR = "BAILLEUR", "Bailleur de Fonds"
    CITOYEN = "CITOYEN", "Citoyen"
    # JOURNALISTE conservé pour compatibilité DB — nouveaux comptes utilisent CITOYEN + profession
    JOURNALISTE = "JOURNALISTE", "Journaliste (déprécié → CITOYEN+profession)"


class Profession(models.TextChoices):
    CITOYEN = "CITOYEN", "Citoyen"
    JOURNALISTE = "JOURNALISTE", "Journaliste"
    ONG = "ONG", "ONG / Société civile"
    CHERCHEUR = "CHERCHEUR", "Chercheur"
    AUTRE = "AUTRE", "Autre"


PUBLIC_ROLES = {Role.CITOYEN, Role.JOURNALISTE}
INSTITUTIONAL_ROLES = {Role.AGENT_FINANCIER, Role.MAIRE, Role.DGDDL, Role.COUR_COMPTES, Role.BAILLEUR}


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Role.DGDDL)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CITOYEN)

    # Lié à une commune (pour AGENT_FINANCIER et MAIRE)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agents",
    )

    # Wallet blockchain (géré par le backend — non exposé au frontend)
    wallet_address = models.CharField(max_length=42, blank=True, default="")

    # Champs spécifiques PUBLIC (CITOYEN / JOURNALISTE / ONG)
    profession = models.CharField(
        max_length=20, choices=Profession.choices,
        default=Profession.CITOYEN, blank=True,
    )
    telephone = models.CharField(max_length=20, blank=True, default="")
    media_organisation = models.CharField(max_length=200, blank=True, default="")
    journaliste_verifie = models.BooleanField(default=False)
    email_verifie = models.BooleanField(default=False)
    is_blockchain_authorized = models.BooleanField(default=False)
    avatar = models.URLField(blank=True, default="")
    reputation_score = models.IntegerField(default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    class Meta:
        db_table = "users"
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"

    @property
    def full_name(self):
        return f"{self.prenom} {self.nom}"

    @property
    def is_public_role(self):
        return self.role in PUBLIC_ROLES

    @property
    def is_journaliste(self):
        """Vrai si l'utilisateur est journaliste (nouveau ou ancien compte)."""
        return self.profession == Profession.JOURNALISTE or self.role == Role.JOURNALISTE

    @property
    def is_institutional_role(self):
        return self.role in INSTITUTIONAL_ROLES
