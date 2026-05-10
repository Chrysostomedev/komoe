from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from .models import Commune
from .serializers import CommuneSerializer
from ..users.permissions import IsDGDDL


def get_optimized_commune_queryset():
    from ..transactions.models import TransactionStatut, TransactionType
    return Commune.objects.annotate(
        _budget_depense=Coalesce(Sum(
            "transactions__montant_fcfa",
            filter=Q(
                transactions__statut=TransactionStatut.VALIDE,
                transactions__type=TransactionType.DEPENSE,
            ),
        ), 0),
        _total_tx_count=Count("transactions", distinct=True),
        _valid_tx_count=Count(
            "transactions",
            filter=Q(transactions__statut=TransactionStatut.VALIDE),
            distinct=True,
        ),
    ).order_by("nom")


class CommuneListView(generics.ListAPIView):
    """Public : liste de toutes les communes actives, avec champs calculés."""
    serializer_class = CommuneSerializer
    permission_classes = [AllowAny]
    pagination_class = None


    def get_queryset(self):
        qs = get_optimized_commune_queryset().filter(is_active=True)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(nom__icontains=search)
        region = self.request.query_params.get("region")
        if region:
            qs = qs.filter(region__iexact=region)
        return qs


class CommuneDetailView(generics.RetrieveAPIView):
    """Public : détail d'une commune."""
    serializer_class = CommuneSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return get_optimized_commune_queryset().filter(is_active=True)


class CommuneAdminView(generics.ListCreateAPIView):
    """DGDDL uniquement : créer/modifier des communes."""
    serializer_class = CommuneSerializer
    permission_classes = [IsDGDDL]
    pagination_class = None


    def get_queryset(self):
        return get_optimized_commune_queryset()


class CommuneAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """DGDDL uniquement : modifier/supprimer une commune."""
    serializer_class = CommuneSerializer
    permission_classes = [IsDGDDL]

    def get_queryset(self):
        return get_optimized_commune_queryset()


class ProjetListView(generics.ListCreateAPIView):
    """Liste des projets. Les bailleurs ne voient que les leurs."""
    from .models import Projet
    from .serializers import ProjetSerializer
    queryset = Projet.objects.all().select_related("commune", "bailleur")
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from .models import Projet
        user = self.request.user
        qs = Projet.objects.all().select_related("commune", "bailleur").order_by("-created_at")
        if user.role == "BAILLEUR":
            return qs.filter(bailleur=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "BAILLEUR":
            serializer.save(bailleur=user)
        else:
            serializer.save()


class ProjetDetailView(generics.RetrieveUpdateDestroyAPIView):
    from .models import Projet
    from .serializers import ProjetSerializer
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticated]


class ConfirmerDotationView(generics.UpdateAPIView):
    """DGDDL : Enregistre le hash blockchain de la dotation."""
    queryset = Commune.objects.all()
    serializer_class = CommuneSerializer
    permission_classes = [IsDGDDL]

    def patch(self, request, *args, **kwargs):
        commune = self.get_object()
        tx_hash = request.data.get("blockchain_tx_hash_dotation")
        if not tx_hash:
            from rest_framework.response import Response
            return Response({"error": "Hash manquant"}, status=400)
        
        commune.blockchain_tx_hash_dotation = tx_hash
        commune.save()
        
        from rest_framework.response import Response
        return Response({
            "status": "success",
            "commune": commune.nom,
            "budget": commune.budget_annuel_fcfa,
            "tx_hash": tx_hash
        })

