from web3 import Web3

RPC_URL = "https://polygon-amoy-bor-rpc.publicnode.com"
CONTRACT_ADDRESS = Web3.to_checksum_address("0xca2dc21b138788ae2e22bad5e60fd84bca851a34")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
ABI = [{"inputs": [], "name": "totalTransactions", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}]

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

try:
    total = contract.functions.totalTransactions().call()
    print(f"Total des transactions sur le contrat : {total}")
except Exception as e:
    print(f"Erreur: {e}")
