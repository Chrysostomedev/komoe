import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFCFA(montant: number | undefined | null) {
  if (montant == null) return "0 FCFA";
  return new Intl.NumberFormat('fr-CI').format(montant) + ' FCFA';
}

export function formatDateShort(dateStr: string | undefined | null) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export function polygonscanTxUrl(hash: string) {
  return `https://amoy.polygonscan.com/tx/${hash}`;
}

export function polygonscanAddressUrl(address: string) {
  return `https://amoy.polygonscan.com/address/${address}`;
}

export function ipfsFileUrl(hash: string) {
  return `https://ipfs.io/ipfs/${hash}`;
}

export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  // Supprime les balises HTML, remplace les entités courantes et nettoie les espaces
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateHash(hash: string | undefined | null, chars = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-4)}`;
}
