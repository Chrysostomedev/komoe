from .models import Notification

def notify_user(user, titre, message, type_notif="SYSTEME"):
    """Crée une notification pour un utilisateur."""
    if user:
        return Notification.objects.create(
            user=user,
            titre=titre,
            message=message,
            type_notif=type_notif
        )
    return None

def notify_commune_maire(commune, titre, message, type_notif="SYSTEME"):
    """Notifie le maire d'une commune spécifique."""
    from ..users.models import User
    maires = User.objects.filter(commune=commune, role="MAIRE")
    for maire in maires:
        notify_user(maire, titre, message, type_notif)
