import os
from web3 import Web3
import json

RPC_URL = "https://polygon-amoy-bor-rpc.publicnode.com"
CONTRACT_ADDRESS = Web3.to_checksum_address("0xca2dc21b138788ae2e22bad5e60fd84bca851a34")

w3 = Web3(Web3.HTTPProvider(RPC_URL))

ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "depenseId", "type": "string"},
            {"indexed": True, "name": "communeId", "type": "string"},
            {"indexed": False, "name": "montant", "type": "uint256"},
            {"indexed": False, "name": "categorie", "type": "string"},
            {"indexed": False, "name": "ipfsHash", "type": "string"},
            {"indexed": True, "name": "soumisePar", "type": "address"},
            {"indexed": False, "name": "timestamp", "type": "uint256"}
        ],
        "name": "DepenseSoumise",
        "type": "event"
    }
]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

try:
    latest = w3.eth.block_number
    # Limite max du RPC: 10 000 blocs
    events = contract.events.DepenseSoumise.get_logs(from_block=latest - 10000)
    
    print(f"\n--- REGISTRE BLOCKCHAIN RETROUVE (10k blocs) ---")
    if not events:
        print("Aucune transaction trouvée sur les 10 000 derniers blocs.")
    else:
        for event in events:
            args = event['args']
            print(f"ID: {args['depenseId']} | CommuneID: {args['communeId']} | Montant: {args['montant']} | Hash: {event['transactionHash'].hex()}")
except Exception as e:
    print(f"Erreur: {e}")
