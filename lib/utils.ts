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
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function polygonscanTxUrl(hash: string) {
  return `https://amoy.polygonscan.com/tx/${hash}`;
}

export function ipfsFileUrl(hash: string) {
  return `https://ipfs.io/ipfs/${hash}`;
}
