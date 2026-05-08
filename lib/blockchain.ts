export const BUDGET_LEDGER_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_id", "type": "string" },
      { "internalType": "string", "name": "_commune", "type": "string" },
      { "internalType": "uint256", "name": "_montant", "type": "uint256" },
      { "internalType": "string", "name": "_categorie", "type": "string" },
      { "internalType": "string", "name": "_ipfsHash", "type": "string" }
    ],
    "name": "soumettreDepense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "depenseId", "type": "string" },
      { "internalType": "string", "name": "communeId", "type": "string" },
      { "internalType": "uint256", "name": "montant", "type": "uint256" },
      { "internalType": "string", "name": "categorie", "type": "string" },
      { "internalType": "string", "name": "ipfsHash", "type": "string" }
    ],
    "name": "validerDepense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalTransactions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "recetteId", "type": "string" },
      { "internalType": "string", "name": "communeId", "type": "string" },
      { "internalType": "uint256", "name": "montant", "type": "uint256" },
      { "internalType": "string", "name": "source", "type": "string" },
      { "internalType": "string", "name": "ipfsHash", "type": "string" }
    ],
    "name": "enregistrerRecette",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "wallet", "type": "address" }],
    "name": "attribuerRoleAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "wallet", "type": "address" }],
    "name": "attribuerRoleMaire",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "wallet", "type": "address" }
    ],
    "name": "revoquerRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const BUDGET_LEDGER_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xae3ba377c763d6c622991408932e93430035b05f"
) as `0x${string}`;
