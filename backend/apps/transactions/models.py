import uuid
from django.db import models
from django.conf import settings


class TransactionType(models.TextChoices):
    DEPENSE = "DEPENSE", "Dépense"
    RECETTE = "RECETTE", "Recette"


class TransactionStatut(models.TextChoices):
    BROUILLON = "BROUILLON", "Brouillon"
    SOUMIS = "SOUMIS", "Soumis (en attente de validation)"
    VALIDE = "VALIDE", "Validé sur blockchain"
    REJETE = "REJETE", "Rejeté"


class CategorieDepense(models.TextChoices):
    INFRASTRUCTURE = "INFRASTRUCTURE", "Infrastructure"
    SANTE = "SANTE", "Santé"
    EDUCATION = "EDUCATION", "Éducation"
    EAU_ASSAINISSEMENT = "EAU_ASSAINISSEMENT", "Eau & Assainissement"
    SECURITE = "SECURITE", "Sécurité"
    ADMINISTRATION = "ADMINISTRATION", "Administration"
    AGRICULTURE = "AGRICULTURE", "Agriculture"
    CULTURE_SPORT = "CULTURE_SPORT", "Culture & Sport"
    AUTRE = "AUTRE", "Autre"


class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    statut = models.CharField(
        max_length=20,
        choices=TransactionStatut.choices,
        default=TransactionStatut.BROUILLON,
    )

    # Données financières
    montant_fcfa = models.BigIntegerField()
    categorie = models.CharField(max_length=50, choices=CategorieDepense.choices, default=CategorieDepense.AUTRE)
    description = models.TextField(blank=True, default="")
    motif_rejet = models.TextField(blank=True, default="", help_text="Explication du Maire en cas de rejet")
    periode = models.CharField(max_length=7, help_text="Format : YYYY-MM (ex: 2025-01)")
    
    projet = models.ForeignKey(
        "communes.Projet",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
        help_text="Projet associé à cette transaction (optionnel)"
    )

    # Documents
    ipfs_hash = models.CharField(max_length=100, blank=True, default="")
    ipfs_url = models.URLField(blank=True, default="")

    # Blockchain
    blockchain_tx_hash_soumission = models.CharField(max_length=100, blank=True, default="")
    blockchain_tx_hash_validation = models.CharField(max_length=100, blank=True, default="")
    blockchain_synced_at = models.DateTimeField(null=True, blank=True)

    # Acteurs
    soumis_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="transactions_soumises",
    )
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions_validees",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "transactions"
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} {self.montant_fcfa:,} FCFA — {self.commune.nom} ({self.statut})"


class Signalement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="signalements",
    )
    description = models.TextField()
    sujet = models.CharField(max_length=200, default="Anomalie financière")
    transaction = models.ForeignKey(
        "Transaction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signalements",
        help_text="Transaction spécifique concernée (optionnel)",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="signalements",
    )
    is_reviewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "signalements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Signalement {self.sujet} — {self.commune.nom}"


# ─── H1 : Preuves jointes aux signalements (IPFS) ────────────────────────────

class PreuveSignalement(models.Model):
    """Photo ou document uploadé sur IPFS comme preuve d'un signalement citoyen."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="preuves",
    )
    ipfs_hash = models.CharField(max_length=100)
    ipfs_url = models.URLField()
    nom_fichier = models.CharField(max_length=255, blank=True, default="")
    type_fichier = models.CharField(
        max_length=10,
        choices=[("image", "Image"), ("pdf", "PDF"), ("autre", "Autre")],
        default="image",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "preuves_signalements"
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"Preuve {self.nom_fichier} — {self.signalement.sujet}"


# ─── H3 : Vote citoyen sur les priorités de dépenses ─────────────────────────

class PropositionStatut(models.TextChoices):
    ACTIVE = "ACTIVE", "Active (en cours de vote)"
    VALIDEE = "VALIDEE", "Validée communautairement"
    REJETEE = "REJETEE", "Rejetée"
    EXPIREE = "EXPIREE", "Expirée"
    CONVERTIE = "CONVERTIE", "Convertie en transaction"


class PropositionDepense(models.Model):
    """Proposition de dépense soumise par un citoyen pour vote communautaire."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="propositions",
    )
    titre = models.CharField(max_length=200)
    description = models.TextField()
    categorie = models.CharField(max_length=50, choices=CategorieDepense.choices, default=CategorieDepense.AUTRE)
    budget_demande_fcfa = models.BigIntegerField(default=0)
    soumis_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="propositions_soumises",
    )
    statut = models.CharField(
        max_length=20,
        choices=PropositionStatut.choices,
        default=PropositionStatut.ACTIVE,
    )
    deadline_vote = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "propositions_depenses"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.statut}] {self.titre} — {self.commune.nom}"

    @property
    def nb_soutiens(self):
        return self.votes.filter(type_vote="SOUTIEN").count()

    @property
    def nb_oppositions(self):
        return self.votes.filter(type_vote="OPPOSITION").count()

    @property
    def score_vote(self):
        return self.nb_soutiens - self.nb_oppositions

    @property
    def pct_soutien(self):
        total = self.votes.count()
        if total == 0:
            return 0
        return round((self.nb_soutiens / total) * 100, 1)


class VoteProposition(models.Model):
    """Vote d'un citoyen sur une proposition (1 vote par citoyen par proposition)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposition = models.ForeignKey(
        PropositionDepense,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    citoyen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes_propositions",
    )
    type_vote = models.CharField(
        max_length=10,
        choices=[("SOUTIEN", "Soutien"), ("OPPOSITION", "Opposition")],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votes_propositions"
        unique_together = [("proposition", "citoyen")]

    def __str__(self):
        return f"{self.citoyen.full_name} → {self.type_vote} sur {self.proposition.titre}"


# ─── H10 : Système de Notifications (SSE) ────────────────────────────────────

class Notification(models.Model):
    """Notification pour les événements importants (dépenses, votes, etc.)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    titre = models.CharField(max_length=150)
    message = models.TextField()
    type_notif = models.CharField(
        max_length=20,
        choices=[
            ("TRANSACTION", "Transaction"),
            ("VOTE", "Vote"),
            ("PROPOSITION", "Proposition"),
            ("SIGNALEMENT", "Signalement"),
            ("SYSTEME", "Système"),
        ],
        default="SYSTEME",
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type_notif}] {self.titre} pour {self.user.full_name}"


# ─── H4 : Vote communautaire sur la véracité d'un signalement ────────────────

class VoteSignalement(models.Model):
    """Vote d'un citoyen sur la crédibilité d'un signalement."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signalement = models.ForeignKey(
        Signalement,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    citoyen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes_signalements",
    )
    verdict = models.CharField(
        max_length=10,
        choices=[("CREDIBLE", "Crédible"), ("INFONDE", "Infondé")],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votes_signalements"
        unique_together = [("signalement", "citoyen")]


# ─── H11 : Suivi des Projets de Développement (Vérification Terrain) ──────────

class ProjetTransaction(models.Model):
    """Lien entre un projet et ses dépenses réelles."""
    projet = models.ForeignKey("communes.Projet", on_delete=models.CASCADE, related_name="liens_transactions")
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name="projets_lies")

    class Meta:
        db_table = "projets_transactions"
        unique_together = [("projet", "transaction")]


# ─── H9 : Suivi des Rapports PDF Générés ─────────────────────────────────────

class RapportPDF(models.Model):
    """Archive des rapports de transparence générés et archivés sur IPFS."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commune = models.ForeignKey(
        "communes.Commune",
        on_delete=models.CASCADE,
        related_name="rapports_pdf",
    )
    periode = models.CharField(max_length=20, help_text="Ex: Janvier 2026")
    ipfs_hash = models.CharField(max_length=100, blank=True, default="")
    ipfs_url = models.URLField(blank=True, default="")
    genere_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="rapports_generes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "rapports_pdf"
        ordering = ["-created_at"]
