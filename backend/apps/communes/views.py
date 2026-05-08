from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from .models import Commune
from .serializers import CommuneSerializer
from ..users.permissions import IsDGDDL


class CommuneListView(generics.ListAPIView):
    """Public : liste de toutes les communes actives, avec champs calculés."""
    serializer_class = CommuneSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from ..transactions.models import TransactionStatut, TransactionType
        qs = Commune.objects.filter(is_active=True).annotate(
            _budget_depense=Coalesce(Sum(
                "transactions__montant_fcfa",
                filter=Q(
                    transactions__statut=TransactionStatut.VALIDE,
                    transactions__type=TransactionType.DEPENSE,
                ),
            ), 0),
            _tx_count=Count(
                "transactions",
                filter=Q(transactions__statut=TransactionStatut.VALIDE),
                distinct=True,
            ),
        )
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(nom__icontains=search)
        region = self.request.query_params.get("region")
        if region:
            qs = qs.filter(region__iexact=region)
        return qs


class CommuneDetailView(generics.RetrieveAPIView):
    """Public : détail d'une commune."""
    queryset = Commune.objects.filter(is_active=True)
    serializer_class = CommuneSerializer
    permission_classes = [AllowAny]


class CommuneAdminView(generics.ListCreateAPIView):
    """DGDDL uniquement : créer/modifier des communes."""
    queryset = Commune.objects.all()
    serializer_class = CommuneSerializer
    permission_classes = [IsDGDDL]


class CommuneAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """DGDDL uniquement : modifier/supprimer une commune."""
    queryset = Commune.objects.all()
    serializer_class = CommuneSerializer
    permission_classes = [IsDGDDL]
