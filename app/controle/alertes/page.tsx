"use client";

import StatsCard from "@/components/ui/StatsCard";
import { AlertTriangle, Clock, XCircle, TrendingDown, Loader2, ShieldAlert, Zap, Search } from "lucide-react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateShort, formatFCFA } from "@/lib/utils";

export default function AlertesPage() {
  const { communes, loading: lcLoading } = useCommunesList();
  const { transactions, loading: ltLoading } = useTransactionsList();
  const loading = lcLoading || ltLoading;

  const communesBas = communes.filter((c: any) => c.score_transparence < 50);
  const enAttente = transactions.filter((t: any) => t.statut === "SOUMIS");
  const rejetes = transactions.filter((t: any) => t.statut === "REJETE");
  const brouillons = transactions.filter((t: any) => t.statut === "BROUILLON");

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
             <ShieldAlert className="text-rose-500" /> Centre de Surveillance
          </h2>
          <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
             Analyse des risques, détection d'anomalies financières et suivi des retards de publication sur l'ensemble du territoire.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-rose-500/10 text-rose-600 px-4 py-2 rounded-xl border border-rose-500/20">
           <Zap size={14} className="fill-rose-600" />
           <span className="text-[10px] font-black uppercase tracking-widest">Temps Réel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Scores < 50" value={communesBas.length} icon={<TrendingDown className="text-rose-500" />} />
        <StatsCard label="En Attente" value={enAttente.length} icon={<Clock className="text-amber-500" />} />
        <StatsCard label="Rejets Critiques" value={rejetes.length} icon={<XCircle className="text-rose-600" />} />
        <StatsCard label="Brouillons" value={brouillons.length} icon={<AlertTriangle className="text-orange-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Communes à faible score */}
        <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border bg-rose-50/10">
          <CardHeader className="p-8 border-b border-rose-100 bg-rose-50/50">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-rose-700 flex items-center gap-3">
              <TrendingDown className="w-5 h-5" />
              Collectivités sous vigilance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {loading && <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /> <span className="text-xs font-black uppercase tracking-widest">Scan national...</span></div>}
            {!loading && communesBas.length === 0 && (
              <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-border">
                 <p className="text-sm font-bold text-muted-foreground">Aucune commune en alerte critique.</p>
              </div>
            )}
            {!loading && communesBas.sort((a: any, b: any) => a.score_transparence - b.score_transparence).map((c: any) => (
              <div key={c.id} className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-rose-100 hover:shadow-lg transition-all hover:border-rose-300">
                <div className="space-y-1">
                  <p className="font-black text-foreground group-hover:text-rose-600 transition-colors">{c.nom}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{c.region}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-24 bg-rose-100 rounded-full h-1.5 overflow-hidden">
                       <div className="h-full bg-rose-500" style={{ width: `${c.score_transparence}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-rose-600">{c.score_transparence}/100</span>
                  </div>
                </div>
                <div className="bg-rose-500 text-white p-3 rounded-xl shadow-lg shadow-rose-500/30">
                   <TrendingDown size={18} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Transactions en attente */}
        <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border">
          <CardHeader className="p-8 border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              Validation en suspens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {!loading && enAttente.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                 <p className="text-sm font-bold text-muted-foreground">Flux de validation à jour.</p>
              </div>
            )}
            {!loading && enAttente.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl hover:bg-muted/30 transition-all">
                <div className="min-w-0">
                  <p className="font-black text-foreground truncate">{tx.description}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">
                    {tx.commune_detail?.nom ?? `Commune #${tx.commune}`} · {formatDateShort(tx.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-sm text-foreground tabular-nums">{formatFCFA(tx.montant_fcfa)}</p>
                  <Badge variant="secondary" className="mt-1 rounded-lg text-[9px] font-black">EN ATTENTE</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
