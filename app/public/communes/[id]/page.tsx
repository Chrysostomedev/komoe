"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Globe, MapPin, Activity, ShieldCheck, Wallet, PieChart, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { communesApi, transactionsApi, type Commune, type Transaction } from "@/lib/api";
import { formatFCFA, formatDateShort, polygonscanTxUrl, truncateHash, stripHtml } from "@/lib/constants";
import StatsCard from "@/components/ui/StatsCard";

export default function PublicCommuneDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [commune, setCommune] = useState<Commune | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, t] = await Promise.all([
          communesApi.detail(id),
          transactionsApi.list({ commune: id, statut: 'VALIDE' })
        ]);
        setCommune(c);
        setTransactions(t.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement des données certifiées...</p>
    </div>
  );

  if (!commune) return (
    <div className="max-w-4xl mx-auto py-20 text-center">
      <p className="text-xl font-black text-destructive italic">Commune introuvable</p>
      <Link href="/public/communes">
        <button className="mt-4 font-bold text-primary hover:underline flex items-center gap-2 mx-auto">
          <ArrowLeft size={16} /> Retour au répertoire
        </button>
      </Link>
    </div>
  );

  const txRate = commune.budget_annuel_fcfa > 0 
    ? ((commune.budget_depense_fcfa / commune.budget_annuel_fcfa) * 100).toFixed(1) 
    : '0';

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-20">
      <Link href="/public/communes" className="inline-flex items-center text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest italic">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour au répertoire national
      </Link>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[40px] bg-card p-12 text-foreground shadow-2xl border border-border">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-20 pointer-events-none">
          <Globe size={400} className="text-primary translate-x-1/2 -translate-y-1/4" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black uppercase tracking-widest px-3 py-1">
              Collectivité Territoriale
            </Badge>
            <span className="text-xs font-bold text-muted-foreground italic uppercase tracking-tighter">ID: {commune.code}</span>
          </div>
          
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic">{commune.nom}</h1>
            <p className="text-xl font-medium text-muted-foreground flex items-center gap-2 mt-2 italic">
              <MapPin size={20} className="text-primary" /> {commune.region} — Côte d&apos;Ivoire
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8 border-t border-border">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 italic">Budget 2026</p>
              <p className="text-3xl font-black tabular-nums">{formatFCFA(commune.budget_annuel_fcfa)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 italic">Consommé</p>
              <p className="text-3xl font-black tabular-nums text-primary">{formatFCFA(commune.budget_depense_fcfa)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 italic">Transparence</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tabular-nums text-emerald-500">{commune.score_transparence}</span>
                <span className="text-muted-foreground font-bold text-sm">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden bg-card/50 backdrop-blur-xl border">
            <CardHeader className="bg-muted/30 border-b border-border p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground italic flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                Journal des transactions certifiées ({transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-8 hover:bg-muted/30 transition-all group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-2">
                      <p className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{stripHtml(tx.description)}</p>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                         <span className="bg-muted px-2 py-1 rounded-md">{tx.categorie}</span>
                         <span>{formatDateShort(tx.validated_at || tx.created_at)}</span>
                         {tx.blockchain_tx_hash_validation && (
                           <a 
                             href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)} 
                             target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1.5 text-purple-600 hover:underline"
                           >
                             TX: {truncateHash(tx.blockchain_tx_hash_validation, 6)} <ExternalLink size={10} />
                           </a>
                         )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                       <p className={`text-xl font-black tabular-nums ${tx.type === 'DEPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                         {tx.type === 'DEPENSE' ? '−' : '+'} {formatFCFA(tx.montant_fcfa)}
                       </p>
                       <Badge variant="success" className="text-[8px] h-5 rounded-md px-2 mt-1">SCELLÉ</Badge>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-20 text-center text-muted-foreground italic">
                    Aucune transaction certifiée n&apos;a été publiée pour cette commune.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[32px] border border-border bg-muted/20 p-8 space-y-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-foreground italic flex items-center gap-2">
               <ShieldCheck className="text-primary" size={16} /> Audit & Contrôle
             </h3>
             <div className="space-y-4">
               <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">Taux d&apos;exécution</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border shadow-inner">
                      <div className="h-full bg-primary" style={{ width: `${txRate}%` }}></div>
                    </div>
                    <span className="text-xs font-black italic">{txRate}%</span>
                  </div>
               </div>
               <div className="pt-4 border-t border-border">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Autorité Municipale</p>
                  <p className="font-bold text-foreground italic">{commune.maire_nom || "Mairie"}</p>
               </div>
             </div>
          </Card>

          <div className="p-8 bg-primary/5 border border-primary/20 rounded-[32px] space-y-4 shadow-xl shadow-primary/5">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                <ShieldCheck size={24} />
             </div>
             <h4 className="font-black text-primary uppercase text-xs tracking-widest italic">Confiance Citoyenne</h4>
             <p className="text-[11px] font-medium text-primary/70 leading-relaxed italic">
               Chaque transaction affichée ici est issue directement du contrat intelligent BudgetLedger, garantissant qu&apos;aucune modification n&apos;est possible a posteriori.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
