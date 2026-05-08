// ─────────────────────────────────────────────────────────────────────────────
// KOMOE — Constantes globales
// Réseau : Polygon (PoS) — Amoy Testnet pour le développement
// ─────────────────────────────────────────────────────────────────────────────

// ── Réseau Polygon ───────────────────────────────────────────────────────────
// Phase développement : Polygon Amoy Testnet (remplace Mumbai, déprécié 2024)
// Phase production    : Polygon Mainnet (137)
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGON_MAINNET_CHAIN_ID = 137;

// RPC configuré via variable d'environnement (.env.local)
// Utilise Alchemy : https://polygon-amoy.g.alchemy.com/v2/{CLE_API}
export const POLYGON_RPC_URL = process.env.NEXT_PUBLIC_POLYGON_RPC_URL ?? '';
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';

// URL de l'explorateur public Polygon
export const POLYGONSCAN_BASE_URL = 'https://amoy.polygonscan.com'; // testnet
// En production : 'https://polygonscan.com'

// URL publique IPFS via Pinata (justificatifs PDF)
export const IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';

// Nombre total de communes ivoiriennes
export const TOTAL_COMMUNES = 201;

// Devise locale
export const DEVISE = 'XOF'; // Franc CFA de l'Afrique de l'Ouest
export const LOCALE = 'fr-CI';

// Smart contract — nom du fichier ABI
export const CONTRACT_ABI_PATH = '/contracts/BudgetLedger.json';

// Catégories ODD
export const CATEGORIES_ODD = [
  { code: 'INFRA',  label: 'Infrastructure',       odd: 'ODD 9',  couleur: '#FF6B35' },
  { code: 'SANTE',  label: 'Santé',                odd: 'ODD 3',  couleur: '#E63946' },
  { code: 'EDU',    label: 'Éducation',             odd: 'ODD 4',  couleur: '#457B9D' },
  { code: 'EAU',    label: 'Eau & Assainissement',  odd: 'ODD 6',  couleur: '#1D9E75' },
  { code: 'AGRI',   label: 'Agriculture',           odd: 'ODD 2',  couleur: '#F4A261' },
  { code: 'SECU',   label: 'Sécurité',              odd: 'ODD 16', couleur: '#6A4C93' },
  { code: 'FONDS',  label: 'Fonds Alloués',         odd: 'ODD 17', couleur: '#2A9D8F' },
  { code: 'ADMIN',  label: 'Administration',        odd: 'ODD 16', couleur: '#8D99AE' },
] as const;

// ── Utilitaires formatage ────────────────────────────────────────────────────
export const formatFCFA = (amount: number): string =>
  new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString('fr-CI', { dateStyle: 'long' });

export const formatDateShort = (isoString: string): string =>
  new Date(isoString).toLocaleDateString('fr-CI', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const truncateHash = (hash: string, chars = 6): string =>
  hash ? `${hash.slice(0, chars + 2)}...${hash.slice(-4)}` : '';

export const polygonscanTxUrl = (txHash: string): string =>
  `${POLYGONSCAN_BASE_URL}/tx/${txHash}`;

export const polygonscanAddressUrl = (address: string): string =>
  `${POLYGONSCAN_BASE_URL}/address/${address}`;

export const ipfsFileUrl = (ipfsHash: string): string =>
  `${IPFS_GATEWAY_URL}/${ipfsHash}`;

export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');
};
