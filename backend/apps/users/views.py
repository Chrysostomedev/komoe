from rest_framework import generics, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import RegisterSerializer, UserSerializer, UserCreateByAdminSerializer
from .permissions import IsDGDDL, IsMaireOfCommune
from ..blockchain.service import BlockchainService
from .models import Role


class RegisterView(generics.CreateAPIView):
    """Inscription libre — CITOYEN et JOURNALISTE uniquement."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Compte créé avec succès.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """Profil de l'utilisateur connecté."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListCreateView(generics.ListCreateAPIView):
    """Liste et création des comptes. Filtré par commune pour les maires/agents."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateByAdminSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all().select_related("commune")
        
        if user.role == Role.DGDDL:
            return queryset
        
        if user.role in [Role.MAIRE, Role.AGENT_FINANCIER] and user.commune:
            return queryset.filter(commune=user.commune)
        
        return queryset.filter(id=user.id)

    def perform_create(self, serializer):
        user = self.request.user
        # Si c'est un Maire ou Agent qui crée, on force sa commune
        if user.role in [Role.MAIRE, Role.AGENT_FINANCIER]:
            if not user.commune:
                 raise serializers.ValidationError("Vous n'êtes rattaché à aucune commune.")
            serializer.save(commune=user.commune)
        else:
            serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Consulter/modifier/désactiver un utilisateur (DGDDL national, Maire local)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, (IsDGDDL | IsMaireOfCommune)]
    lookup_field = "id"


@api_view(["PATCH"])
@permission_classes([IsDGDDL])
def verify_journalist(request, id):
    """DGDDL : vérifie le badge journaliste d'un utilisateur."""
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=404)

    user.journaliste_verifie = True
    user.save(update_fields=["journaliste_verifie"])
    return Response({"message": "Journaliste vérifié.", "user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([IsDGDDL])
def authorize_blockchain(request, id):
    """DGDDL : attribue le rôle Agent ou Maire on-chain et met à jour le profil."""
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return Response({"error": "Utilisateur introuvable."}, status=404)

    wallet_address = request.data.get("wallet_address")
    if not wallet_address:
        return Response({"error": "L'adresse wallet est obligatoire."}, status=400)

    blockchain = BlockchainService()
    if not blockchain.is_configured():
        return Response({"error": "Blockchain non configurée sur le serveur."}, status=503)

    try:
        tx_hash = None
        commune_id = str(user.commune.id) if user.commune else ""
        if not commune_id:
             return Response({"error": "L'utilisateur doit être rattaché à une commune."}, status=400)

        if user.role == Role.AGENT_FINANCIER:
            tx_hash = blockchain.attribuer_role_agent(wallet_address, commune_id)
        elif user.role == Role.MAIRE:
            tx_hash = blockchain.attribuer_role_maire(wallet_address, commune_id)
        else:
            return Response({"error": "Seuls les agents et maires peuvent être autorisés on-chain."}, status=400)

        user.wallet_address = wallet_address
        user.is_blockchain_authorized = True
        user.save(update_fields=["wallet_address", "is_blockchain_authorized"])

        return Response({
            "message": f"Rôle attribué on-chain. TX: {tx_hash}",
            "user": UserSerializer(user).data,
            "tx_hash": tx_hash
        })
    except Exception as e:
        return Response({"error": f"Erreur blockchain : {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([IsDGDDL])
def toggle_pause(request):
    """DGDDL : active/désactive le contrat (Pause d'urgence)."""
    action = request.data.get("action") # "pause" ou "unpause"
    blockchain = BlockchainService()
    try:
        if action == "pause":
            tx_hash = blockchain.pause()
        elif action == "unpause":
            tx_hash = blockchain.unpause()
        else:
            return Response({"error": "Action invalide."}, status=400)

        return Response({"message": f"Contrat {action}d avec succès.", "tx_hash": tx_hash})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
