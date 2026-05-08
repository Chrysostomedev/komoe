from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Transaction, TransactionStatut
from .serializers import TransactionSerializer, TransactionCreateSerializer
from apps.users.permissions import IsAgentFinancier, IsMaire
from apps.blockchain.service import BlockchainService


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
        qs = Transaction.objects.filter(commune_id=commune_id).select_related(
            "commune", "soumis_par", "valide_par"
        )
        user = self.request.user
        is_commune_user = (
            user.is_authenticated
            and user.role in ("MAIRE", "AGENT_FINANCIER")
            and user.commune_id == int(commune_id)
        )
        if is_commune_user:
            statut = self.request.query_params.get("statut")
            if statut:
                qs = qs.filter(statut=statut)
        else:
            qs = qs.filter(statut=TransactionStatut.VALIDE)
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
        
        transaction = serializer.save()
        
        if client_tx_hash:
            transaction.blockchain_tx_hash_soumission = client_tx_hash
            transaction.save(update_fields=["blockchain_tx_hash_soumission"])
            return

        # Envoi asynchrone sur blockchain par le serveur (fallback/test)
        try:
            blockchain = BlockchainService()
            if blockchain.is_configured():
                tx_hash = blockchain.soumettre_depense(
                    depense_id=str(transaction.id),
                    commune_id=str(transaction.commune_id),
                    montant=transaction.montant_fcfa,
                    categorie=transaction.categorie,
                    ipfs_hash=transaction.ipfs_hash or "ipfs://pending",
                )
                transaction.blockchain_tx_hash_soumission = tx_hash
                transaction.save(update_fields=["blockchain_tx_hash_soumission"])
        except Exception:
            pass


class TransactionDetailView(generics.RetrieveAPIView):
    """Détail d'une transaction (authentifié)."""
    queryset = Transaction.objects.all().select_related("commune", "soumis_par", "valide_par")
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]


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
    transaction.save(update_fields=["blockchain_tx_hash_soumission"])

    return Response({"message": "Hash de soumission enregistré.", "transaction": TransactionSerializer(transaction).data})


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

    # Ancrage blockchain (seulement si non fourni par le client)
    if not tx_hash:
        blockchain = BlockchainService()
        if blockchain.is_configured():
            try:
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
    transaction.description = transaction.description + f"\n\n[REJET — {timezone.now().strftime('%Y-%m-%d %H:%M')}] {motif}"
    transaction.save()

    return Response(
        {
            "message": "Transaction rejetée.",
            "transaction": TransactionSerializer(transaction).data,
        }
    )


class SignalementListCreateView(generics.ListCreateAPIView):
    """
    Public / Citoyen : Liste ou création d'un signalement.
    Si authentifié : l'auteur est automatiquement l'utilisateur connecté.
    """
    from .models import Signalement
    queryset = Signalement.objects.all().select_related("commune", "auteur")
    from .serializers import SignalementSerializer
    serializer_class = SignalementSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from .models import Signalement
        qs = Signalement.objects.all().select_related("commune", "auteur")
        commune_id = self.request.query_params.get("commune")
        if commune_id:
            qs = qs.filter(commune_id=commune_id)
        return qs

