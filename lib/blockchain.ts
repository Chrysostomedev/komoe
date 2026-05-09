export const BUDGET_LEDGER_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "depenseId", "type": "string" },
      { "internalType": "string", "name": "communeId", "type": "string" },
      { "internalType": "uint256", "name": "montant", "type": "uint256" },
      { "internalType": "string", "name": "categorie", "type": "string" },
      { "internalType": "string", "name": "ipfsHash", "type": "string" }
    ],
    "name": "soumettreDepense",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "soumettreRecette",
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
    "inputs": [],
    "name": "totalTransactions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "wallet", "type": "address" },
      { "internalType": "string", "name": "communeId", "type": "string" }
    ],
    "name": "attribuerRoleAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "wallet", "type": "address" },
      { "internalType": "string", "name": "communeId", "type": "string" }
    ],
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
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "depenseId", "type": "string" },
      { "indexed": true, "internalType": "string", "name": "communeId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "categorie", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "soumisePar", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DepenseSoumise",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "depenseId", "type": "string" },
      { "indexed": true, "internalType": "string", "name": "communeId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "categorie", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "validePar", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DepenseValidee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "recetteId", "type": "string" },
      { "indexed": true, "internalType": "string", "name": "communeId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "source", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "parAgent", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "RecetteSoumise",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "recetteId", "type": "string" },
      { "indexed": true, "internalType": "string", "name": "communeId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "source", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "enregistreePar", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "RecetteEnregistree",
    "type": "event"
  }
] as const;

export const BUDGET_LEDGER_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xae3ba377c763d6c622991408932e93430035b05f"
) as `0x${string}`;
