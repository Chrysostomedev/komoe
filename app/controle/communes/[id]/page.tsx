"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2, MapPin, Activity, ShieldCheck, Wallet, PieChart, ArrowLeft, Loader2, ExternalLink, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { communesApi, transactionsApi, type Commune, type Transaction } from "@/lib/api";
import { formatFCFA, formatDateShort, polygonscanTxUrl, truncateHash, stripHtml } from "@/lib/constants";
import StatsCard from "@/components/ui/StatsCard";

export default function ControleCommuneDetailPage() {
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
          transactionsApi.list({ commune: id }) // All status for controllers
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
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Audit en cours...</p>
    </div>
  );

  if (!commune) return (
    <div className="max-w-4xl mx-auto py-20 text-center">
      <p className="text-xl font-black text-destructive italic">Commune non référencée</p>
      <Link href="/controle/communes">
        <button className="mt-4 font-bold text-primary hover:underline flex items-center gap-2 mx-auto">
          <ArrowLeft size={16} /> Retour au registre
        </button>
      </Link>
    </div>
  );

  const enAttente = transactions.filter(t => t.statut === 'SOUMIS').length;
  const rejets = transactions.filter(t => t.statut === 'REJETE').length;

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/controle/communes" className="inline-flex items-center text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest italic">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au registre national
        </Link>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-8 px-4 font-black uppercase italic text-[10px] border-primary/20 bg-primary/5 text-primary">Vue Contrôleur DGDDL</Badge>
        </div>
      </div>

      {/* Header Audit Premium */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-card border border-border p-10 rounded-[40px] shadow-2xl shadow-primary/5">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-[20px] flex items-center justify-center border border-primary/20 shadow-lg">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">{commune.nom}</h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2 italic">
                <MapPin size={16} className="text-primary" /> {commune.region} — Zone de Contrôle Alpha
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="px-6 py-4 bg-muted/30 rounded-2xl border border-border text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Score Transparence</p>
            <p className="text-2xl font-black text-emerald-500">{commune.score_transparence}<span className="text-xs text-muted-foreground ml-1">/100</span></p>
          </div>
          <div className="px-6 py-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-center">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Alertes (Soumis)</p>
            <p className="text-2xl font-black text-amber-600">{enAttente}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Budget Alloué" value={commune.budget_annuel_fcfa} isCurrency icon={<Wallet className="text-primary" />} />
        <StatsCard label="Dépenses Validées" value={commune.budget_depense_fcfa} isCurrency icon={<PieChart className="text-emerald-500" />} />
        <StatsCard label="Nombre de Rejets" value={rejets} icon={<AlertTriangle className="text-rose-500" />} />
        <StatsCard label="Population" value={commune.population} icon={<Activity className="text-blue-500" />} />
      </div>

      <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
        <CardHeader className="bg-muted/30 border-b border-border p-8">
          <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground italic flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            Historique Complet des Mouvements de Fonds
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                   <tr>
                      <th className="text-left px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Date</th>
                      <th className="text-left px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Description</th>
                      <th className="text-center px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Statut</th>
                      <th className="text-right px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Montant</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Preuve</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-all group">
                         <td className="px-8 py-5">
                            <span className="text-xs font-bold text-muted-foreground italic">{formatDateShort(tx.created_at)}</span>
                         </td>
                         <td className="px-4 py-5">
                            <div className="font-bold text-foreground line-clamp-1">{stripHtml(tx.description)}</div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mt-1">{tx.categorie}</div>
                         </td>
                         <td className="px-4 py-5 text-center">
                            <Badge variant={tx.statut === 'VALIDE' ? 'success' : tx.statut === 'REJETE' ? 'destructive' : 'secondary'} className="rounded-lg px-3 py-1 font-black text-[9px] uppercase">
                               {tx.statut}
                            </Badge>
                         </td>
                         <td className="px-4 py-5 text-right font-black tabular-nums">
                            {formatFCFA(tx.montant_fcfa)}
                         </td>
                         <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                               {tx.blockchain_tx_hash_validation && (
                                  <a href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)} target="_blank" rel="noopener noreferrer" className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
                                     <ShieldCheck size={14} />
                                  </a>
                               )}
                               <Link href={`/commune/transactions/${tx.id}`}>
                                  <div className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-primary hover:text-white transition-colors cursor-pointer border border-border">
                                     <ExternalLink size={14} />
                                  </div>
                               </Link>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {transactions.length === 0 && (
                <div className="p-20 text-center text-muted-foreground italic">
                   Aucune transaction enregistrée pour cet audit.
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
