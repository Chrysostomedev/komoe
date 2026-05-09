"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Network, ExternalLink, CheckCircle, Zap, Loader2 } from "lucide-react";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { truncateHash, polygonscanTxUrl, formatDateShort, stripHtml } from "@/lib/utils";
import { BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";

export default function BlockchainPage() {
  const { transactions = [], loading } = useTransactionsList();
  const txs = transactions.filter((t: any) => t.blockchain_tx_hash_validation);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Réseau Polygon</h2>
        <p className="text-muted-foreground mt-1 text-sm">Transactions enregistrées sur Polygon Amoy Testnet</p>
      </div>

      {/* Infos réseau */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Réseau", value: "Polygon Amoy", sub: "Testnet", color: "text-purple-600" },
          { label: "Chain ID", value: "80002", sub: "Amoy", color: "text-foreground" },
          { label: "Transactions on-chain", value: txs.length.toString(), sub: "Vérifiables", color: "text-emerald-600" },
          { label: "Dernier bloc", value: "—", sub: "Polygon Amoy", color: "text-foreground" },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smart contract */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">Smart Contract BudgetLedger.sol</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Chaque transaction validée par le Maire est inscrite de façon immuable sur Polygon Amoy.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs bg-card border border-purple-200 px-2 py-1 rounded text-purple-700">
                  {BUDGET_LEDGER_ADDRESS}
                </span>
                <Badge variant="secondary">Phase 1 — Démo</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions on-chain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-600" />
            Transactions confirmées sur Polygon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="flex justify-center py-8 text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" />Chargement…</div>}
          {!loading && txs.map((tx) => (
            <div key={tx.id} className="p-4 rounded-xl bg-muted border border-border space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-foreground">{stripHtml(tx.description)}</p>
                  <p className="text-xs text-muted-foreground">{tx.categorie} · {formatDateShort(tx.validated_at ?? tx.created_at)}</p>
                </div>
                <Badge variant="success" className="shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" /> Confirmé
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-mono text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded-lg hover:underline"
                >
                  {truncateHash(tx.blockchain_tx_hash_validation)}
                  <ExternalLink className="w-3 h-3" />
                </a>
                {tx.ipfs_hash && (
                  <span className="text-xs text-teal-600 bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg font-mono">
                    IPFS: {tx.ipfs_hash.slice(0, 14)}…
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
