from django.db import models


class Region(models.TextChoices):
    ABIDJAN = "ABIDJAN", "Abidjan"
    BOUAKE = "BOUAKE", "Bouaké"
    YAMOUSSOUKRO = "YAMOUSSOUKRO", "Yamoussoukro"
    DALOA = "DALOA", "Daloa"
    SAN_PEDRO = "SAN_PEDRO", "San-Pédro"
    KORHOGO = "KORHOGO", "Korhogo"
    AUTRE = "AUTRE", "Autre"


class Commune(models.Model):
    code = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=200)
    region = models.CharField(max_length=50, choices=Region.choices, default=Region.AUTRE)
    population = models.PositiveIntegerField(default=0)
    superficie_km2 = models.FloatField(default=0)
    budget_annuel_fcfa = models.BigIntegerField(default=0)
    score_transparence = models.PositiveIntegerField(default=0, help_text="Score de 0 à 100")
    maire_nom = models.CharField(max_length=200, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "communes"
        verbose_name = "Commune"
        verbose_name_plural = "Communes"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.nom} ({self.region})"


class ProjetStatut(models.TextChoices):
    BROUILLON = "BROUILLON", "Brouillon"
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    EN_COURS = "EN_COURS", "En cours"
    ACHEVE = "ACHEVE", "Achevé"
    ANNULE = "ANNULE", "Annulé"
    SOUS_ENQUETE = "SOUS_ENQUETE", "Sous enquête DGDDL"


class Projet(models.Model):
    commune = models.ForeignKey(Commune, on_delete=models.CASCADE, related_name="projets")
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    budget_alloue_fcfa = models.BigIntegerField(default=0)
    taux_execution = models.FloatField(default=0.0) # 0 to 100
    statut = models.CharField(
        max_length=20, 
        choices=ProjetStatut.choices, 
        default=ProjetStatut.EN_ATTENTE
    )
    bailleur = models.ForeignKey(
        "users.User", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="projets_finances",
        limit_choices_to={'role': 'BAILLEUR'}
    )
    blockchain_audit_hash = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projets"
        verbose_name = "Projet"
        verbose_name_plural = "Projets"

    def __str__(self):
        return f"{self.nom} - {self.commune.nom}"
