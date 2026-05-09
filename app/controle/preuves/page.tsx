"use client";

import StatsCard from "@/components/ui/StatsCard";
import { ShieldCheck, ExternalLink, Copy, Loader2, Globe, Lock, ShieldAlert, Cpu, Building2 } from "lucide-react";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateShort, formatFCFA, polygonscanTxUrl, ipfsFileUrl, stripHtml } from "@/lib/utils";

export default function PreuvesPage() {
  const { transactions, loading } = useTransactionsList();
  const txs = transactions.filter((t: any) => t.blockchain_tx_hash_validation);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
             <ShieldCheck className="text-primary" /> Registre d'Intégrité
          </h2>
          <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
             Chaque validation financière est scellée de façon immuable sur le réseau Polygon Amoy. L'auditabilité est garantie par cryptographie asymétrique.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-500/20">
           <Cpu size={14} className="animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">Node Polygon Amoy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Preuves On-Chain" value={txs.length} icon={<Lock className="text-primary" />} />
        <StatsCard label="Documents IPFS" value={txs.filter((t: any) => t.ipfs_hash).length} icon={<Globe className="text-teal-500" />} />
        <StatsCard label="Volume Audité" value={txs.reduce((s: any, t: any) => s + t.montant_fcfa, 0)} isCurrency icon={<ShieldAlert className="text-amber-500" />} />
        <StatsCard label="Mairies Actives" value={new Set(txs.map((t: any) => t.commune)).size} icon={<Building2 className="text-blue-500" />} />
      </div>

      <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border">
        <CardHeader className="p-8 border-b border-border bg-muted/30">
          <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Livre Blanc de la Transparence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {loading && <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin text-primary" /> <span className="text-xs font-black uppercase tracking-widest">Synchronisation ledger...</span></div>}
          {!loading && txs.map((tx: any) => (
            <div key={tx.id} className="group p-6 rounded-[24px] bg-white border border-border hover:shadow-xl transition-all hover:border-primary/30">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <p className="font-black text-lg text-foreground group-hover:text-primary transition-colors">{stripHtml(tx.description)}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {tx.commune_detail?.nom ?? `Commune #${tx.commune}`} · {tx.categorie} · {formatDateShort(tx.validated_at ?? tx.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-foreground tabular-nums">{formatFCFA(tx.montant_fcfa)}</p>
                  <Badge variant="success" className="mt-1 rounded-lg text-[9px] font-black uppercase">SCÉLLÉ BLOCKCHAIN</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">TX HASH (Polygon)</p>
                    <p className="text-[10px] font-mono text-primary truncate">{tx.blockchain_tx_hash_validation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)} target="_blank" rel="noopener noreferrer" className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                       <ExternalLink size={14} />
                    </a>
                    <button onClick={() => copyToClipboard(tx.blockchain_tx_hash_validation)} className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-slate-200 transition-all">
                       <Copy size={14} />
                    </button>
                  </div>
                </div>

                {tx.ipfs_hash && (
                  <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/10 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">IPFS CID (Justificatif)</p>
                      <p className="text-[10px] font-mono text-teal-600 truncate">{tx.ipfs_hash}</p>
                    </div>
                    <a href={ipfsFileUrl(tx.ipfs_hash)} target="_blank" rel="noopener noreferrer" className="p-2 bg-teal-500/10 text-teal-600 rounded-lg hover:bg-teal-500 hover:text-white transition-all">
                       <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

