"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Search, ExternalLink, XCircle, CheckCircle } from "lucide-react";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { useBlockchainVerify } from "@/lib/hooks/useBlockchainVerify";
import { type Transaction } from "@/lib/api";
import { formatFCFA, formatDateShort, polygonscanTxUrl } from "@/lib/constants";
import { ipfsService } from "@/lib/ipfs";

const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

export default function VerifierPage() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<Transaction | null | "not_found">(null);
  const [blockchainInfo, setBlockchainInfo] = useState<{ blockNumber: number; confirmations: number; status: string } | null>(null);
  const { transactions } = useTransactionsList();
  const { verifyTransaction } = useBlockchainVerify();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockchainInfo(null);
    const found = transactions.find(
      (t) => t.blockchain_tx_hash_validation?.toLowerCase().includes(hash.toLowerCase()) ||
             t.ipfs_hash?.toLowerCase().includes(hash.toLowerCase()) ||
             String(t.id).toLowerCase() === hash.toLowerCase()
    );

    if (found) {
      setResult(found);
      if (found.blockchain_tx_hash_validation) {
        const info = await verifyTransaction(found.blockchain_tx_hash_validation);
        if (info) {
          setBlockchainInfo(info);
        }
      }
    } else {
      if (hash.startsWith("0x") && hash.length === 66) {
        const info = await verifyTransaction(hash);
        if (info) {
          setBlockchainInfo(info);
          setResult({
            id: "onchain_only",
            description: "Transaction enregistrée directement sur Polygon",
            montant_fcfa: 0,
            type: "DEPENSE",
            statut: "VALIDE",
            categorie: "Extraction Directe",
            created_at: new Date().toISOString(),
            validated_at: new Date().toISOString(),
            blockchain_tx_hash_validation: hash,
            commune: 0,
          } as any);
          return;
        }
      }
      setResult("not_found");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Vérifier un reçu</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Entrez un hash Polygon (TX) ou un hash IPFS pour vérifier l&apos;authenticité d&apos;une transaction.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Vérification d&apos;authenticité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="Hash TX Polygon ou Hash IPFS…"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000040] font-mono"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-[#000040] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#000060] transition shrink-0"
            >
              <Search className="w-4 h-4" />
              Vérifier
            </button>
          </form>

          <p className="text-xs text-muted-foreground mt-2">
            Exemple : <span className="font-mono">0x3f8a4b2c…</span> ou <span className="font-mono">QmXkj9abc…</span>
          </p>
        </CardContent>
      </Card>

      {/* Résultat */}
      {result === "not_found" && (
        <Card className="border-red-200">
          <CardContent className="p-6 flex items-center gap-4">
            <XCircle className="w-10 h-10 text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-700">Transaction introuvable</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aucune transaction ne correspond à ce hash dans la base KOMOE.
                Vérifiez directement sur <a href="https://amoy.polygonscan.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Polygonscan Amoy</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && result !== "not_found" && (
        <Card className="border-emerald-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-emerald-700 text-lg">Transaction authentifiée ✓</p>
                <p className="text-sm text-muted-foreground">Enregistrée sur Polygon Amoy — immuable</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              {[
                { label: "Description", value: stripHtml(result.description) },
                { label: "Commune", value: result.commune_detail?.nom ?? `Commune #${result.commune}` },
                { label: "Catégorie", value: result.categorie },
                { label: "Montant", value: formatFCFA(result.montant_fcfa) },
                { label: "Date", value: formatDateShort(result.validated_at ?? result.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}

              {result.blockchain_tx_hash_validation && (
                <div className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground w-24 shrink-0 pt-1">TX Polygon</span>
                  <a href={polygonscanTxUrl(result.blockchain_tx_hash_validation)} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded-lg hover:underline flex items-center gap-1 break-all">
                    {result.blockchain_tx_hash_validation} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {result.ipfs_hash && (
                <div className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground w-24 shrink-0 pt-1">Justificatif</span>
                  <a href={ipfsService.getPublicUrl(result.ipfs_hash)} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-teal-600 bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg hover:underline flex items-center gap-1 break-all">
                    {result.ipfs_hash} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {blockchainInfo && (
                <div className="border-t border-border pt-3 mt-1 flex flex-wrap gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">Bloc de validation</span>
                    <span className="text-sm font-semibold text-foreground">#{blockchainInfo.blockNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Confirmations</span>
                    <span className="text-sm font-semibold text-foreground">{blockchainInfo.confirmations}</span>
                  </div>
                </div>
              )}
            </div>

            <Badge variant={blockchainInfo?.status === "Échoué" ? "destructive" : "success"} className="w-fit">
              <CheckCircle className="w-3 h-3 mr-1" /> Statut: {blockchainInfo?.status || "Confirmé on-chain"}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


