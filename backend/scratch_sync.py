from apps.users.models import User
from apps.communes.models import Commune

# Abobo
u = User.objects.filter(email='maire.abobo@komoe.ci').first()
c = Commune.objects.filter(nom='Abobo').first()
if u and c:
    u.commune = c
    u.save()

# Bassam - Maire
u = User.objects.filter(email='maire.bassam@komoe.ci').first()
c = Commune.objects.filter(nom='Grand-Bassam').first()
if u and c:
    u.commune = c
    u.save()

# Bassam - Agent
u = User.objects.filter(email='agent.bassam@komoe.ci').first()
c = Commune.objects.filter(nom='Grand-Bassam').first()
if u and c:
    u.commune = c
    u.save()
    print("Agent Bassam lie avec succes")

# DGDDL
u = User.objects.filter(email='dgddl@komoe.ci').first()
if u:
    u.is_blockchain_authorized = True
    u.is_staff = True
    u.save()
