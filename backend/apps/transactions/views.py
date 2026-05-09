from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Transaction, TransactionStatut
from .serializers import TransactionSerializer, TransactionCreateSerializer
from ..users.permissions import IsAgentFinancier, IsMaire, IsAgentOrMaire
from ..blockchain.service import BlockchainService
from .utils import formatFCFA



class TransactionListView(generics.ListAPIView):
    """Public : toutes les transactions validées sur blockchain."""
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Transaction.objects.filter(statut=TransactionStatut.VALIDE).select_related(
            "commune", "soumis_par", "valide_par"
        )
        commune_id = self.request.query_params.get("commune")
        if commune_id:
            qs = qs.filter(commune_id=commune_id)
        type_filter = self.request.query_params.get("type")
        if type_filter:
            qs = qs.filter(type=type_filter)
        return qs


class TransactionCommuneListView(generics.ListAPIView):
    """
    Transactions d'une commune spécifique.
    - Public / non authentifié : uniquement VALIDE.
    - MAIRE ou AGENT_FINANCIER de cette commune : tous statuts (avec filtre ?statut= optionnel).
    """
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        commune_id = self.kwargs["commune_id"]
        user = self.request.user
        
        # Base QuerySet
        qs = Transaction.objects.filter(commune_id=commune_id).select_related(
            "commune", "soumis_par", "valide_par"
        )
        
        if user.is_authenticated:
            if user.role == "AGENT_FINANCIER" and user.commune_id == int(commune_id):
                # L'agent voit tout (Brouillons inclus)
                pass 
            elif user.role == "MAIRE" and user.commune_id == int(commune_id):
                # Le maire voit tout SAUF les brouillons
                qs = qs.exclude(statut=TransactionStatut.BROUILLON)
            else:
                # Autres utilisateurs authentifiés : uniquement validé
                qs = qs.filter(statut=TransactionStatut.VALIDE)
        else:
            # Public : uniquement validé
            qs = qs.filter(statut=TransactionStatut.VALIDE)

        # Filtres optionnels
        statut = self.request.query_params.get("statut")
        if statut:
            qs = qs.filter(statut=statut)
            
        type_filter = self.request.query_params.get("type")
        if type_filter:
            qs = qs.filter(type=type_filter)
            
        return qs


class TransactionCreateView(generics.CreateAPIView):
    """AGENT_FINANCIER : soumettre une nouvelle dépense/recette."""
    serializer_class = TransactionCreateSerializer
    permission_classes = [IsAgentFinancier]

    def perform_create(self, serializer):
        # Récupérer le hash client s'il est déjà fourni (signature MetaMask de l'agent)
        client_tx_hash = self.request.data.get("blockchain_tx_hash_soumission")
        
        transaction = serializer.save() # Un seul save() suffit ici
        
        if client_tx_hash:
            transaction.blockchain_tx_hash_soumission = client_tx_hash
            transaction.statut = TransactionStatut.SOUMIS
            transaction.save(update_fields=["blockchain_tx_hash_soumission", "statut"])


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Détail, mise à jour ou suppression d'une transaction."""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.all().select_related("commune", "soumis_par", "valide_par")
        if user.is_authenticated:
            if user.role == "MAIRE":
                return qs.filter(commune=user.commune).exclude(statut=TransactionStatut.BROUILLON)
            elif user.role == "AGENT_FINANCIER":
                from django.db.models import Q
                return qs.filter(commune=user.commune).filter(Q(soumis_par=user) | ~Q(statut=TransactionStatut.BROUILLON))
            elif user.role == "DGDDL":
                return qs  # DGDDL sees everything
        return qs.filter(statut=TransactionStatut.VALIDE)

    def perform_update(self, serializer):
        instance = self.get_object()
        # On ne peut modifier QUE les brouillons
        if instance.statut != TransactionStatut.BROUILLON:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cette transaction est scellée ou en cours de validation. Modification interdite.")
        serializer.save()

    def perform_destroy(self, instance):
        # Sécurité : Seul l'auteur peut supprimer, et seulement les brouillons
        if instance.soumis_par != self.request.user and self.request.user.role != "DGDDL":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous ne pouvez pas supprimer cette transaction.")
        
        if instance.statut != TransactionStatut.BROUILLON:
             from rest_framework.exceptions import ValidationError
             raise ValidationError("Impossible de supprimer une transaction déjà ancrée ou soumise.")
             
        instance.delete()


@api_view(["PATCH"])
@permission_classes([IsAgentFinancier])
def confirmer_hash_soumission(request, pk):
    """
    AGENT : après la signature MetaMask côté client, met à jour le tx_hash de soumission.
    Appelé juste après writeContractAsync pour lier l'ID Django à l'event blockchain.
    """
    try:
        transaction = Transaction.objects.get(pk=pk, soumis_par=request.user)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)

    tx_hash = request.data.get("blockchain_tx_hash_soumission", "").strip()
    if not tx_hash:
        return Response({"error": "Le tx_hash de soumission est requis."}, status=400)
    if not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        return Response({"error": "Format de hash invalide (attendu : 0x + 64 hex)."}, status=400)

    transaction.blockchain_tx_hash_soumission = tx_hash
    
    # S3 : Vérification on-chain du hash de soumission (Agent)
    blockchain = BlockchainService()
    if blockchain.is_configured():
        # On vérifie que le hash existe et a été émis par le wallet de l'agent (si renseigné)
        if not blockchain.verifier_hash_transaction(tx_hash, expected_sender=request.user.wallet_address):
            return Response({"error": "Le hash blockchain fourni est invalide ou introuvable sur Polygon."}, status=400)

    transaction.statut = TransactionStatut.SOUMIS  # On passe de BROUILLON à SOUMIS
    transaction.save(update_fields=["blockchain_tx_hash_soumission", "statut"])

    return Response({"message": "Hash de soumission enregistré et vérifié sur Polygon.", "transaction": TransactionSerializer(transaction).data})


@api_view(["PATCH"])
@permission_classes([IsMaire])
def valider_transaction(request, pk):
    """MAIRE : valide définitivement une transaction sur blockchain."""
    try:
        transaction = Transaction.objects.select_related("commune").get(pk=pk)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)

    if transaction.statut != TransactionStatut.SOUMIS:
        return Response(
            {"error": f"Seules les transactions avec statut SOUMIS peuvent être validées. Statut actuel : {transaction.statut}"},
            status=400,
        )

    if transaction.commune != request.user.commune:
        return Response({"error": "Vous ne pouvez valider que les transactions de votre commune."}, status=403)

    tx_hash = request.data.get("blockchain_tx_hash", "").strip() or None

    # Valider le format du hash client (doit être un hash Ethereum valide 0x + 64 hex)
    if tx_hash and not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        return Response(
            {"error": "Le hash blockchain fourni est invalide (format attendu : 0x + 64 caractères hex)."},
            status=400,
        )

    # S3 : Vérification on-chain du hash de validation (Maire)
    blockchain = BlockchainService()
    if tx_hash and blockchain.is_configured():
        # On vérifie que le hash existe et a été émis par le wallet du maire (si renseigné)
        if not blockchain.verifier_hash_transaction(tx_hash, expected_sender=request.user.wallet_address):
            return Response({"error": "Le hash de validation fourni est invalide ou introuvable sur Polygon."}, status=400)

    # Ancrage blockchain (seulement si non fourni par le client)
    if not tx_hash:
        if blockchain.is_configured():
            try:
                if transaction.type == "RECETTE":
                    tx_hash = blockchain.enregistrer_recette(
                        recette_id=str(transaction.id),
                        commune_id=str(transaction.commune_id),
                        montant=transaction.montant_fcfa,
                        source=transaction.categorie,
                        ipfs_hash=transaction.ipfs_hash or "ipfs://pending",
                    )
                else:
                    tx_hash = blockchain.valider_depense(
                        depense_id=str(transaction.id),
                        commune_id=str(transaction.commune_id),
                        montant=transaction.montant_fcfa,
                        categorie=transaction.categorie,
                        ipfs_hash=transaction.ipfs_hash or "ipfs://pending",
                    )
            except Exception as e:
                return Response({"error": f"Erreur blockchain : {str(e)}"}, status=500)

    if tx_hash:
        transaction.blockchain_tx_hash_validation = tx_hash
        transaction.blockchain_synced_at = timezone.now()

    transaction.statut = TransactionStatut.VALIDE
    transaction.valide_par = request.user
    transaction.validated_at = timezone.now()
    transaction.save()

    # H10 : Notifier l'agent
    from .notifications import notify_user
    if transaction.soumis_par:
        notify_user(
            user=transaction.soumis_par,
            titre="Transaction Validée ✅",
            message=f"Votre transaction '{transaction.description[:30]}...' a été validée par le Maire et ancrée sur la blockchain.",
            type_notif="TRANSACTION"
        )

    return Response(
        {
            "message": "Transaction validée et ancrée sur blockchain.",
            "transaction": TransactionSerializer(transaction).data,
        }
    )


@api_view(["PATCH"])
@permission_classes([IsMaire])
def rejeter_transaction(request, pk):
    """MAIRE : rejette une transaction avec un motif obligatoire."""
    try:
        transaction = Transaction.objects.select_related("commune").get(pk=pk)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)

    if transaction.statut != TransactionStatut.SOUMIS:
        return Response(
            {"error": f"Seules les transactions SOUMIS peuvent être rejetées. Statut actuel : {transaction.statut}"},
            status=400,
        )

    if transaction.commune != request.user.commune:
        return Response({"error": "Vous ne pouvez rejeter que les transactions de votre commune."}, status=403)

    motif = request.data.get("motif", "").strip()
    if not motif:
        return Response({"error": "Un motif de rejet est obligatoire."}, status=400)

    transaction.statut = TransactionStatut.REJETE
    transaction.valide_par = request.user
    transaction.validated_at = timezone.now()
    transaction.motif_rejet = motif
    transaction.save()

    # H10 : Notifier l'agent
    from .notifications import notify_user
    if transaction.soumis_par:
        notify_user(
            user=transaction.soumis_par,
            titre="Transaction Rejetée ❌",
            message=f"Votre transaction '{transaction.description[:30]}...' a été rejetée. Motif : {motif[:50]}",
            type_notif="TRANSACTION"
        )

    return Response(
        {
            "message": "Transaction rejetée.",
            "transaction": TransactionSerializer(transaction).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAgentFinancier])
def creer_recette_brouillon(request):
    """AGENT : Étape 1 - Crée une recette en brouillon."""
    serializer = TransactionCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    transaction = serializer.save(
        type="RECETTE",
        statut=TransactionStatut.BROUILLON,
        commune=request.user.commune,
        soumis_par=request.user
    )
    return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsMaire])
def confirmer_recette(request, pk):
    """MAIRE : Étape 2 - Confirme la recette après signature blockchain."""
    try:
        transaction = Transaction.objects.get(pk=pk, commune=request.user.commune, type="RECETTE")
    except Transaction.DoesNotExist:
        return Response({"error": "Recette introuvable."}, status=404)

    tx_hash = request.data.get("blockchain_tx_hash_validation", "").strip()
    if not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        return Response({"error": "Format de hash invalide."}, status=400)

    transaction.blockchain_tx_hash_validation = tx_hash
    transaction.blockchain_synced_at = timezone.now()
    transaction.statut = TransactionStatut.VALIDE
    transaction.valide_par = request.user
    transaction.validated_at = timezone.now()
    transaction.save()

    return Response({
        "message": "Recette validée et ancrée.",
        "transaction": TransactionSerializer(transaction).data
    })


class SignalementListCreateView(generics.ListCreateAPIView):
    """Public / Citoyen : Liste ou création d'un signalement."""
    from .serializers import SignalementSerializer
    serializer_class = SignalementSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import Signalement
        qs = Signalement.objects.all().select_related("commune", "auteur").prefetch_related("preuves")
        commune_id = self.request.query_params.get("commune")
        if commune_id:
            qs = qs.filter(commune_id=commune_id)
        # Filtrer par auteur si "mes_signalements=true"
        if self.request.query_params.get("mes_signalements") == "true":
            if self.request.user.is_authenticated:
                qs = qs.filter(auteur=self.request.user)
            else:
                return qs.none()
        return qs


class SignalementDetailView(generics.RetrieveUpdateAPIView):
    """MAIRE ou DGDDL : Marquer un signalement comme traité."""
    from .serializers import SignalementSerializer
    serializer_class = SignalementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from .models import Signalement
        user = self.request.user
        qs = Signalement.objects.all()
        # Si c'est une requête de mise à jour (PATCH/PUT)
        if self.request.method in ['PUT', 'PATCH']:
            if user.role == "MAIRE":
                return qs.filter(commune=user.commune)
            elif user.role == "DGDDL":
                return qs
            else:
                return qs.none() # Les autres ne peuvent pas modifier
        # Pour GET, tout le monde peut voir
        return qs


# ─── H1 : Upload de preuves pour un signalement ──────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ajouter_preuve_signalement(request, pk):
    """
    Ajoute une preuve IPFS à un signalement existant.
    Payload attendu : { ipfs_hash, ipfs_url, nom_fichier, type_fichier }
    """
    from .models import Signalement, PreuveSignalement
    from .serializers import PreuveSignalementSerializer

    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({"error": "Signalement introuvable."}, status=404)

    # Seul l'auteur peut ajouter des preuves
    if signalement.auteur and signalement.auteur != request.user:
        return Response({"error": "Action non autorisée."}, status=403)

    serializer = PreuveSignalementSerializer(data={**request.data, "signalement": str(pk)})
    if serializer.is_valid():
        serializer.save()
        # H5 : +5 points bonus pour une preuve IPFS
        request.user.reputation_score = (request.user.reputation_score or 0) + 5
        request.user.save(update_fields=["reputation_score"])
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


# ─── H3 : Propositions de dépenses + Votes citoyens ─────────────────────────

class PropositionListCreateView(generics.ListCreateAPIView):
    """
    GET  : liste des propositions actives (public)
    POST : soumettre une nouvelle proposition (citoyen authentifié)
    """
    from .serializers import PropositionSerializer
    serializer_class = PropositionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import PropositionDepense
        qs = PropositionDepense.objects.all().select_related("commune", "soumis_par").prefetch_related("votes")
        commune_id = self.request.query_params.get("commune")
        if commune_id:
            qs = qs.filter(commune_id=commune_id)
        statut = self.request.query_params.get("statut", "ACTIVE")
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]


class PropositionDetailView(generics.RetrieveAPIView):
    """Détail d'une proposition (public)."""
    from .models import PropositionDepense
    from .serializers import PropositionSerializer
    queryset = PropositionDepense.objects.all().select_related("commune", "soumis_par").prefetch_related("votes")
    serializer_class = PropositionSerializer
    permission_classes = [AllowAny]


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def voter_proposition(request, pk):
    """
    POST   → Soumettre ou changer son vote (SOUTIEN / OPPOSITION)
    DELETE → Retirer son vote
    """
    from .models import PropositionDepense, VoteProposition
    from django.db import IntegrityError

    try:
        proposition = PropositionDepense.objects.get(pk=pk)
    except PropositionDepense.DoesNotExist:
        return Response({"error": "Proposition introuvable."}, status=404)

    if proposition.statut != "ACTIVE":
        return Response({"error": "Cette proposition n'est plus ouverte au vote."}, status=400)

    if request.method == "DELETE":
        deleted, _ = VoteProposition.objects.filter(proposition=proposition, citoyen=request.user).delete()
        if deleted:
            return Response({"message": "Vote retiré."})
        return Response({"error": "Vous n'avez pas voté sur cette proposition."}, status=404)

    # POST
    type_vote = request.data.get("type_vote")
    if type_vote not in ("SOUTIEN", "OPPOSITION"):
        return Response({"error": "type_vote doit être SOUTIEN ou OPPOSITION."}, status=400)

    vote, created = VoteProposition.objects.update_or_create(
        proposition=proposition,
        citoyen=request.user,
        defaults={"type_vote": type_vote},
    )

    # H5 : +2 points pour voter
    if created:
        request.user.reputation_score = (request.user.reputation_score or 0) + 2
        request.user.save(update_fields=["reputation_score"])

    # Vérifier seuil : >60% soutien ET >50 votes → passer en VALIDEE
    total_votes = proposition.votes.count()
    if total_votes >= 50 and proposition.pct_soutien >= 60:
        proposition.statut = "VALIDEE"
        proposition.save(update_fields=["statut"])
        # H5 : +30 points pour le soumetteur si sa proposition est validée
        if proposition.soumis_par:
            proposition.soumis_par.reputation_score = (proposition.soumis_par.reputation_score or 0) + 30
            proposition.soumis_par.save(update_fields=["reputation_score"])
            
            # H10 : Notifier le soumetteur
            from .notifications import notify_user
            notify_user(
                user=proposition.soumis_par,
                titre="Proposition Validée ! 🎉",
                message=f"Félicitations ! Votre proposition '{proposition.titre[:30]}' a été validée par la communauté (>60% de soutien).",
                type_notif="VOTE"
            )

    return Response({
        "message": "Vote enregistré.",
        "nb_soutiens": proposition.nb_soutiens,
        "nb_oppositions": proposition.nb_oppositions,
        "pct_soutien": proposition.pct_soutien,
        "statut": proposition.statut,
    })


# ─── H4/H6 : Vote sur Signalement & Alerte Virale ────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def voter_signalement(request, pk):
    """Citoyen : Vote sur la crédibilité d'un signalement."""
    from .models import Signalement, VoteSignalement
    try:
        signalement = Signalement.objects.get(pk=pk)
    except Signalement.DoesNotExist:
        return Response({"error": "Signalement introuvable."}, status=404)

    verdict = request.data.get("verdict")
    if verdict not in ["CREDIBLE", "INFONDE"]:
        return Response({"error": "Verdict invalide."}, status=400)

    vote, created = VoteSignalement.objects.update_or_create(
        signalement=signalement,
        citoyen=request.user,
        defaults={"verdict": verdict}
    )

    # Gamification : +2 points pour participation
    request.user.reputation_score = (request.user.reputation_score or 0) + 2
    request.user.save(update_fields=["reputation_score"])

    # H6 : Logique VIRALE
    votes = signalement.votes.all()
    nb_votes = votes.count()
    nb_credibles = votes.filter(verdict="CREDIBLE").count()
    pct_credible = (nb_credibles / nb_votes) * 100 if nb_votes > 0 else 0

    if nb_votes >= 20 and pct_credible >= 70:
        # Notifier la DGDDL (H6)
        from .notifications import notify_user
        from ..users.models import User
        dgddls = User.objects.filter(role="CONTROLEUR") # DGDDL = CONTROLEUR dans Komoe
        for dg in dgddls:
            notify_user(
                user=dg,
                titre="⚠️ SIGNALEMENT VIRAL !",
                message=f"L'incident '{signalement.sujet}' à {signalement.commune.nom} est jugé crédible par {nb_credibles} citoyens.",
                type_notif="SIGNALEMENT"
            )

    return Response({
        "message": "Merci pour votre contribution citoyenne.",
        "nb_votes": nb_votes,
        "pct_credible": pct_credible
    })


# ─── I3 : Détection d'Anomalies (Heuristiques) ────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAgentOrMaire]) # Ou IsDGDDL si rôle existant
def detecter_anomalies(request):
    """DGDDL/Maire : Identifie les transactions suspectes via heuristiques."""
    from .models import Transaction, TransactionStatut
    from django.db.models import Avg, Count
    
    anomalies = []
    
    # 1. Montants aberrants (> 3x la moyenne de la catégorie dans la commune)
    stats = Transaction.objects.filter(statut=TransactionStatut.VALIDE).values("commune", "categorie").annotate(moyenne=Avg("montant_fcfa"))
    
    for stat in stats:
        suspects = Transaction.objects.filter(
            commune_id=stat["commune"],
            categorie=stat["categorie"],
            montant_fcfa__gt=stat["moyenne"] * 3,
            statut=TransactionStatut.VALIDE
        )
        for t in suspects:
            anomalies.append({
                "type": "MONTANT_ABERRANT",
                "transaction_id": t.id,
                "description": f"Montant {t.montant_fcfa:,} FCFA est 3x supérieur à la moyenne ({int(stat['moyenne']):,})",
                "commune": t.commune.nom
            })

    # 2. Doublons potentiels (même montant, même catégorie, même commune, < 7 jours)
    # Note : Logique simplifiée pour démo
    doublons = Transaction.objects.values("commune", "montant_fcfa", "categorie").annotate(count=Count("id")).filter(count__gt=1)
    for d in doublons:
        anomalies.append({
            "type": "DOUBLON_POTENTIEL",
            "montant": d["montant_fcfa"],
            "categorie": d["categorie"],
            "description": "Plusieurs transactions identiques détectées."
        })

    return Response({"anomalies": anomalies})


# ─── I5 : Open Data API ───────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def open_data_stats(request):
    """Public : Statistiques nationales pour transparence totale."""
    from .models import Transaction, TransactionStatut, Signalement
    from django.db.models import Sum
    
    total_valide = Transaction.objects.filter(statut=TransactionStatut.VALIDE).aggregate(total=Sum("montant_fcfa"))["total"] or 0
    nb_transactions = Transaction.objects.filter(statut=TransactionStatut.VALIDE).count()
    nb_signalements = Signalement.objects.count()
    
    return Response({
        "total_depenses_xof": total_valide,
        "nb_transactions_certifiees": nb_transactions,
        "nb_signalements_citoyens": nb_signalements,
        "blockchain": "Polygon Amoy Testnet",
        "last_update": timezone.now()
    })


# ─── I8 : Simulation de Digest Mensuel ────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsMaire])
def simuler_digest_mensuel(request):
    """Simule l'envoi d'un digest mensuel aux citoyens de la commune."""
    from .notifications import notify_user
    from ..users.models import User
    from .models import Transaction, TransactionStatut
    from django.db.models import Sum
    
    commune = request.user.commune
    citoyens = User.objects.filter(commune=commune, role="CITOYEN")
    
    # Calculer stats du mois
    mois_actuel = timezone.now().strftime("%Y-%m")
    total_mois = Transaction.objects.filter(
        commune=commune, 
        statut=TransactionStatut.VALIDE,
        periode=mois_actuel
    ).aggregate(total=Sum("montant_fcfa"))["total"] or 0
    
    for citoyen in citoyens:
        notify_user(
            user=citoyen,
            titre=f"📊 Votre Digest Komoe — {mois_actuel}",
            message=f"Ce mois-ci, {formatFCFA(total_mois)} ont été certifiés sur Polygon pour votre commune. Score de transparence : {commune.nom} en hausse !",
            type_notif="SYSTEME"
        )
        
    return Response({"message": f"Digest simulé pour {citoyens.count()} citoyens."})


# ─── I4 : QR Code pour vérification physique ─────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def qr_code_transaction(request, pk):
    """
    Génère un QR code PNG pointant vers /public/verifier?hash=<blockchain_hash>
    Nécessite: pip install qrcode[pil]
    """
    try:
        import qrcode
        import io
        from django.http import HttpResponse

        transaction = Transaction.objects.get(pk=pk)
        base_url = request.build_absolute_uri("/").rstrip("/")
        hash_val = transaction.blockchain_tx_hash_validation or transaction.blockchain_tx_hash_soumission or str(pk)
        verify_url = f"{base_url}/public/verifier?hash={hash_val}"

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(verify_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0f172a", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer)
        buffer.seek(0)

        return HttpResponse(buffer.read(), content_type="image/png")
    except ImportError:
        return Response({"error": "qrcode non installé. Exécuter: pip install qrcode[pil]"}, status=500)
    except Transaction.DoesNotExist:
        return Response({"error": "Transaction introuvable."}, status=404)


# ─── H9 : Rapports PDF Automatisés (Audit) ───────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def generer_rapport_pdf(request, commune_id):
    """Génère un rapport de transparence PDF pour une commune."""
    from django.template.loader import get_template
    from xhtml2pdf import pisa
    from django.http import HttpResponse
    from ..communes.models import Commune
    from .models import Transaction, Signalement
    import datetime

    try:
        commune = Commune.objects.get(pk=commune_id)
        transactions = Transaction.objects.filter(commune=commune).order_by("-created_at")[:20]
        signalements = Signalement.objects.filter(commune=commune).order_by("-created_at")[:10]
        
        context = {
            "commune": commune,
            "transactions": transactions,
            "signalements": signalements,
            "date_rapport": datetime.datetime.now(),
            "score": commune.score_transparence,
        }
        
        # Template HTML minimaliste et premium
        template_src = """
        <html>
        <head>
            <style>
                @page { size: a4; margin: 2cm; }
                body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; }
                .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 24pt; font-weight: bold; color: #1e3a8a; }
                .badge { background: #dcfce7; color: #166534; padding: 5px 10px; border-radius: 5px; font-size: 10pt; }
                .section-title { font-size: 16pt; margin-top: 30px; color: #334155; border-left: 4px solid #3b82f6; padding-left: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #f8fafc; text-align: left; padding: 10px; font-size: 10pt; border-bottom: 1px solid #e2e8f0; }
                td { padding: 10px; font-size: 9pt; border-bottom: 1px solid #f1f5f9; }
                .footer { margin-top: 50px; font-size: 8pt; color: #94a3b8; text-align: center; }
                .score-box { background: #eff6ff; padding: 20px; border-radius: 10px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">KOMOE — Rapport d'Audit Citoyen</div>
                <div style="margin-top: 10px;">Commune de <strong>{{ commune.nom }}</strong></div>
            </div>

            <div class="score-box">
                <div style="font-size: 12pt; font-weight: bold;">Score de Transparence : {{ score }}/100</div>
                <div style="font-size: 9pt; color: #64748b;">Généré le {{ date_rapport|date:"d/m/Y H:i" }}</div>
            </div>

            <div class="section-title">Dernières Transactions Certifiées</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Catégorie</th>
                        <th>Montant (FCFA)</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {% for tx in transactions %}
                    <tr>
                        <td>{{ tx.created_at|date:"d/m/Y" }}</td>
                        <td>{{ tx.type }}</td>
                        <td>{{ tx.categorie }}</td>
                        <td>{{ tx.montant_fcfa }}</td>
                        <td>{{ tx.description|truncatechars:50 }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>

            <div class="section-title">Signalements Citoyens Récents</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Sujet</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {% for s in signalements %}
                    <tr>
                        <td>{{ s.created_at|date:"d/m/Y" }}</td>
                        <td>{{ s.sujet }}</td>
                        <td>{% if s.is_reviewed %}Traité{% else %}En attente{% endif %}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>

            <div class="footer">
                Ce document est généré automatiquement par la plateforme KOMOE. <br/>
                Toutes les données sont certifiées via la blockchain Polygon et archivées sur IPFS.
            </div>
        </body>
        </html>
        """
        
        from django.template import Template, Context
        template = Template(template_src)
        html = template.render(Context(context))
        
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="rapport_komoe_{commune.nom}_{datetime.date.today()}.pdf"'
        
        pisa_status = pisa.CreatePDF(html, dest=response)
        if pisa_status.err:
            return Response({"error": "Erreur lors de la génération du PDF"}, status=500)
            
        return response
    except Commune.DoesNotExist:
        return Response({"error": "Commune introuvable"}, status=404)


# ─── H10 : Notifications API & SSE ──────────────────────────────────────────

from .serializers import NotificationSerializer
from .models import Notification

class NotificationListView(generics.ListAPIView):
    """Liste des notifications de l'utilisateur."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def marquer_notifs_lues(request):
    """Marque toutes les notifications de l'utilisateur comme lues."""
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"message": "Notifications marquées comme lues."})


def notifications_stream(request):
    """
    Endpoint SSE pour le streaming de notifications en temps réel.
    Note: Dans un environnement de production réel, utilisez Django Channels.
    Ceci est une implémentation simplifiée pour le hackathon.
    """
    from django.http import StreamingHttpResponse
    import time
    import json

    def event_stream():
        # On garde une trace de la dernière notif envoyée
        last_id = None
        user = request.user
        
        while True:
            if not user.is_authenticated:
                break
                
            # Chercher de nouvelles notifications
            new_notifs = Notification.objects.filter(user=user)
            if last_id:
                new_notifs = new_notifs.filter(created_at__gt=last_id)
            
            notif = new_notifs.first()
            if notif:
                last_id = notif.created_at
                data = {
                    "id": str(notif.id),
                    "titre": notif.titre,
                    "message": notif.message,
                    "type": notif.type_notif,
                }
                yield f"data: {json.dumps(data)}\n\n"
            
            time.sleep(3) # Polling toutes les 3s pour simuler le temps réel

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no" # Indispensable pour Nginx
    return response
