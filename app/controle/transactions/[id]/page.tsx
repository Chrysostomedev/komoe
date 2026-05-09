"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ExternalLink, ArrowLeft, FileText, CheckCircle2, Loader2, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTransactionDetail } from "@/lib/hooks/useTransactions";
import { formatFCFA, formatDateShort, polygonscanTxUrl, ipfsFileUrl, stripHtml } from "@/lib/utils";

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { transaction: tx, loading, error } = useTransactionDetail(id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Chargement des preuves...</p>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
          <FileText size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Transaction introuvable</h2>
          <p className="text-muted-foreground mt-2 font-medium">L'identifiant spécifié ne correspond à aucune donnée du registre.</p>
        </div>
        <Link href="/controle/transactions">
          <Button variant="outline" className="rounded-xl px-8 font-black uppercase text-[10px]">Retour au registre</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12 space-y-8">
      <Link href="/controle/transactions" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour au registre national
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Détails de la Preuve</h2>
            <Badge variant="success" className="rounded-lg px-4 h-8 font-black uppercase text-[10px]">SCÉLLÉ BLOCKCHAIN</Badge>
          </div>
          <p className="text-muted-foreground font-mono text-xs bg-muted/50 px-3 py-1 rounded-lg inline-block border border-border">ID: {tx.id}</p>
        </div>
        <div className="flex gap-3">
          {tx.blockchain_tx_hash_validation && (
            <Button 
              variant="outline" 
              asChild
              className="gap-2 text-primary border-primary/20 hover:bg-primary hover:text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px]"
            >
              <a href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} /> Polygon Scan
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 shadow-2xl border-border rounded-[32px] overflow-hidden">
          <CardContent className="p-8">
            <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-8 flex items-center gap-2">
               <Lock className="w-5 h-5 text-primary" /> Informations Budgétaires
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full bg-muted/20 p-6 rounded-2xl border border-border">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Description complète</p>
                <p className="font-bold text-foreground leading-relaxed">{stripHtml(tx.description)}</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Montant Certifié</p>
                  <p className="text-3xl font-black text-primary tabular-nums italic tracking-tighter">{formatFCFA(tx.montant_fcfa)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Catégorie</p>
                  <Badge variant="secondary" className="rounded-lg px-4 h-8 font-black text-[10px] uppercase">{tx.categorie}</Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Commune Émettrice</p>
                  <p className="font-black text-foreground uppercase italic">{tx.commune_detail?.nom || `Code #${tx.commune}`}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tx.commune_detail?.region}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Date de Sceau</p>
                  <p className="font-black text-foreground italic">{formatDateShort(tx.validated_at || tx.created_at)}</p>
                </div>
              </div>

              <div className="col-span-full border-t border-border pt-8 mt-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Globe className="w-4 h-4 text-teal-500" /> Preuve Cryptographique (Hash)
                </p>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl font-mono text-[11px] text-emerald-400 break-all shadow-inner relative group">
                  {tx.blockchain_tx_hash_validation || tx.blockchain_tx_hash_soumission || "Non disponible"}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden bg-muted/30">
            <CardContent className="p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6">Pièce Justificative IPFS</h3>
              {tx.ipfs_hash ? (
                <div className="group bg-card p-6 rounded-2xl border border-border hover:border-teal-500 transition-all shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition-all">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate uppercase italic">Document Source</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{tx.ipfs_hash}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    asChild
                    className="w-full rounded-xl h-12 border-teal-500/20 text-teal-600 hover:bg-teal-500 hover:text-white font-black uppercase text-[10px]"
                  >
                    <a href={ipfsFileUrl(tx.ipfs_hash)} target="_blank" rel="noopener noreferrer">
                      Consulter sur IPFS
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                   <p className="text-xs font-bold text-muted-foreground italic">Aucun justificatif lié.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6">Cycle de Vie</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase italic text-foreground">Saisie Initiale</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{tx.soumis_par_detail?.full_name || 'Agent Financier'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase italic text-foreground">Sceau Blockchain</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{tx.valide_par_detail?.full_name || 'Maire / Ordonnateur'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
