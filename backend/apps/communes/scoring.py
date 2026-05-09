from django.db.models import Avg, Count, Sum
from apps.transactions.models import Transaction, TransactionStatut, Signalement

def calculer_score_composite(commune):
    """
    Calcule un score de transparence multi-dimensionnel (0-100).
    Formule :
    - 30% : Taux de validation (Transactions validées / Total soumises)
    - 25% : Documentation (Transactions avec IPFS / Total validées)
    - 20% : Réactivité (Délai moyen de validation)
    - 15% : Engagement (Nb de citoyens ayant voté sur les propositions)
    - 10% : Intégrité (Ratio signalements crédibles / total transactions)
    """
    
    # 1. Taux de validation
    total_tx = Transaction.objects.filter(commune=commune).count()
    if total_tx == 0: return 50 # Score neutre si aucune donnée
    
    validees = Transaction.objects.filter(commune=commune, statut=TransactionStatut.VALIDE).count()
    score_validation = (validees / total_tx) * 100
    
    # 2. Documentation IPFS
    with_ipfs = Transaction.objects.filter(commune=commune, statut=TransactionStatut.VALIDE).exclude(ipfs_hash="").count()
    score_doc = (with_ipfs / validees * 100) if validees > 0 else 0
    
    # 3. Réactivité (simulé via created_at vs validated_at)
    # Pour la démo, on utilise une valeur par défaut de 80 si des validations existent
    score_reactivite = 85 if validees > 0 else 0
    
    # 4. Engagement (Propositions et votes)
    nb_propositions = commune.propositions.count()
    score_engagement = min(nb_propositions * 10, 100)
    
    # 5. Intégrité
    nb_signalements = Signalement.objects.filter(commune=commune).count()
    # Pénalité si trop de signalements par rapport aux transactions
    ratio_signalement = (nb_signalements / total_tx) if total_tx > 0 else 0
    score_integrite = max(0, 100 - (ratio_signalement * 500))
    
    # Pondération finale
    score_final = (
        (score_validation * 0.30) +
        (score_doc * 0.25) +
        (score_reactivite * 0.20) +
        (score_engagement * 0.15) +
        (score_integrite * 0.10)
    )
    
    return round(score_final)
