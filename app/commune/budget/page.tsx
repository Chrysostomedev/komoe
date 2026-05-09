"use client";

import { Card, CardContent } from "@/components/ui/Card";
import StatsCard from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/Button";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, PieChart, Receipt, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCommuneDetail } from "@/lib/hooks/useCommunes";
import { useCommuneTransactions } from "@/lib/hooks/useTransactions";
import { formatFCFA, stripHtml } from "@/lib/constants";

export default function BudgetCommune() {
  const { user } = useAuth();
  const communeId = user?.commune;
  
  const { commune, loading: loadingCommune } = useCommuneDetail(communeId ?? null);
  const { transactions, loading: loadingTx } = useCommuneTransactions(communeId ?? null, { statut: 'VALIDE' });
  

  // Calculs réels
  const stats = useMemo(() => {
    const budgetInitial = commune?.budget_annuel_fcfa ?? 0;
    const totalDepenses = transactions.reduce((sum, tx) => sum + (tx.type === 'DEPENSE' ? tx.montant_fcfa : 0), 0);
    const totalRecettes = transactions.reduce((sum, tx) => sum + (tx.type === 'RECETTE' ? tx.montant_fcfa : 0), 0);
    const reste = budgetInitial + totalRecettes - totalDepenses;
    
    // Distribution par catégorie (Dépenses seulement pour le graphique)
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'DEPENSE').forEach(tx => {
      categories[tx.categorie] = (categories[tx.categorie] || 0) + tx.montant_fcfa;
    });

    const distribution = Object.entries(categories).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalDepenses > 0 ? (amount / totalDepenses) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      budgetInitial,
      totalDepenses,
      totalRecettes,
      reste,
      distribution
    };
  }, [commune, transactions]);



  if (loadingCommune || loadingTx) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement des données réelles...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Gestion du Budget — {commune?.nom}</h2>
          <p className="text-muted-foreground mt-1 font-medium text-sm">Répartition et allocation des fonds basées sur les transactions certifiées.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatsCard label="Budget Initial (Dotation)" value={stats.budgetInitial} isCurrency icon={<PieChart className="text-primary" />} />
        <StatsCard label="Recettes Locales" value={stats.totalRecettes} isCurrency icon={<Receipt className="text-emerald-500" />} />
        <StatsCard label="Dépenses Cumulées" value={stats.totalDepenses} isCurrency trend={stats.totalDepenses > 0 ? "up" : undefined} icon={<Receipt className="text-rose-500" />} />
        <StatsCard label="Reste à Réaliser" value={stats.reste} isCurrency trend={stats.reste < 0 ? "down" : "up"} icon={<Wallet className="text-blue-500" />} />
      </div>

      <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border bg-card/40 backdrop-blur-xl">
        <CardContent className="p-10">
          <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-widest flex items-center gap-3">
             <span className="w-2 h-6 bg-primary rounded-full"></span>
             Répartition réelle des dépenses validées
          </h3>
          
          {stats.distribution.length > 0 ? (
            <div className="space-y-8">
              {stats.distribution.map((item, idx) => (
                <div key={item.name} className="group">
                  <div className="flex justify-between text-sm font-black text-foreground mb-3 uppercase tracking-tighter">
                    <span className="group-hover:text-primary transition-colors">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-muted-foreground">{formatFCFA(item.amount)}</span>
                      <span className="tabular-nums">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-3.5 p-0.5 border border-border">
                    <div 
                      className={`h-full rounded-full shadow-lg transition-all duration-1000 ${
                        idx === 0 ? 'bg-primary shadow-primary/20' : 
                        idx === 1 ? 'bg-amber-500 shadow-amber-500/20' : 
                        idx === 2 ? 'bg-emerald-500 shadow-emerald-500/20' : 
                        'bg-blue-500 shadow-blue-500/20'
                      }`} 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
              <PieChart className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">Aucune dépense validée pour le moment</p>
              <p className="text-xs mt-2">La répartition s'affichera dès que le Maire aura validé des transactions.</p>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
              Données certifiées par la blockchain Polygon
            </p>
            <Link href="/commune/transactions" className="text-[10px] text-primary hover:underline font-black uppercase tracking-widest">
              Consulter le journal des transactions →
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
