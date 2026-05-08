import os
import sys
import django
from pathlib import Path

# Configurer Django pour accéder aux settings
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.blockchain.service import BlockchainService

def test_connection():
    service = BlockchainService()
    print("--- Test de Connexion Blockchain KOMOE ---")
    
    if not service.is_configured():
        print("ERREUR : Le service n'est pas correctement configure. Verifiez votre fichier .env.")
        return

    print("OK : Configuration .env detectee.")
    
    try:
        w3 = service._get_w3()
        addr = w3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))
        code = w3.eth.get_code(addr)
        
        print(f"DEBUG : Adresse testee : {addr}")
        if len(code) <= 2:
            print("ERREUR : Il n'y a PAS de contrat a cette adresse (code vide).")
            return
        else:
            print(f"OK : Un contrat de {len(code)} octets a ete detecte.")

        # Essayer de lire le compteur
        contract = service._get_contract()
        count = contract.functions.totalTransactions().call()
        print(f"OK : CONNEXION REUSSIE ! Transactions : {count}")

    except Exception as e:
        print(f"ERREUR LORS DU DIAGNOSTIC : {str(e)}")

if __name__ == "__main__":
    test_connection()
