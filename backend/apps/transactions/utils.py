def formatFCFA(amount):
    """
    Formatte un montant en FCFA avec séparateur de milliers (espace).
    Ex: 1000000 -> "1 000 000 FCFA"
    """
    try:
        if amount is None:
            return "0 FCFA"
        # On s'assure que c'est un entier pour le formatage
        amount_int = int(float(amount))
        # Format avec espaces comme séparateurs de milliers
        formatted = "{:,}".format(amount_int).replace(",", " ")
        return f"{formatted} FCFA"
    except (ValueError, TypeError):
        return f"{amount} FCFA"
