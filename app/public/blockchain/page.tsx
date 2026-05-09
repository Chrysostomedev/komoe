"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Network, ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { truncateHash, polygonscanTxUrl, formatFCFA, formatDateShort } from "@/lib/constants";
import { useBlockchainVerify } from "@/lib/hooks/useBlockchainVerify";
import { ethers } from "ethers";

export default function PublicBlockchainPage() {
  const { transactions, loading } = useTransactionsList();
  const { totalTransactions } = useBlockchainVerify();
  const [latestBlocks, setLatestBlocks] = useState<number[]>([]);
  const txs = transactions.filter((t) => t.blockchain_tx_hash_validation);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://rpc-amoy.polygon.technology";
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const current = await provider.getBlockNumber();
        const blocks: number[] = [];
        for (let i = 0; i < 5; i++) {
          if (current - i >= 0) blocks.push(current - i);
        }
        setLatestBlocks(blocks);
      } catch (err) {
        console.error("Erreur direct Polygon verification:", err);
      }
    }
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Réseau Polygon</h2>
        <p className="text-muted-foreground mt-1 text-sm">Transactions budgétaires publiques enregistrées sur Polygon Amoy Testnet</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Réseau", value: "Polygon Amoy", sub: "Chain ID 80002" },
          { label: "Transactions on-chain", value: totalTransactions !== null ? totalTransactions.toString() : "—", sub: "Immuables" },
          { label: "Montant total vérifié", value: formatFCFA(txs.reduce((s, t) => s + t.montant_fcfa, 0)), sub: "Sur Polygon" },
          { label: "Dernier bloc", value: latestBlocks[0]?.toString() || "—", sub: "Polygon Amoy" },
        ].map(({ label, value, sub }) => (
          <Card key={label}><CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-lg font-bold text-foreground truncate">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-600" />
                Transactions publiques confirmées sur Polygon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <div className="flex justify-center py-8 text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" />Chargement…</div>}
              {!loading && txs.map((tx) => (
                <div key={tx.id} className="p-4 rounded-xl bg-muted border border-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.categorie} · {formatDateShort(tx.validated_at ?? tx.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground">{formatFCFA(tx.montant_fcfa)}</p>
                      <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Confirmé</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-mono text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded-lg hover:underline">
                      {truncateHash(tx.blockchain_tx_hash_validation)} <ExternalLink className="w-3 h-3" />
                    </a>
                    {tx.ipfs_hash && (
                      <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-lg font-mono">IPFS: {tx.ipfs_hash.slice(0, 14)}…</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                ⏱️ Blocs en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {latestBlocks.map((blk) => (
                <div key={blk} className="p-3 border border-border rounded-lg flex items-center justify-between text-sm bg-muted/30">
                  <span className="font-mono font-bold text-foreground">#{blk}</span>
                  <Badge variant="success">Synchronisé</Badge>
                </div>
              ))}
              {latestBlocks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">Chargement des blocs…</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


