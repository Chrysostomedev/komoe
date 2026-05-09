"use client";

import { Card, CardContent } from "@/components/ui/Card";
import DataTable, { ColumnConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Plus, Briefcase, TrendingUp, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { formatFCFA } from "@/lib/constants";
import { useProjets } from "@/lib/hooks/useProjets";

export default function ProjetsBailleur() {
  const { projets, loading, error } = useProjets();
  
  const totalBudget = projets.reduce((sum, p) => sum + p.budget_alloue_fcfa, 0);
  const avgExecution = projets.length > 0 ? projets.reduce((sum, p) => sum + p.taux_execution, 0) / projets.length : 0;

  const columns: ColumnConfig<any>[] = [
    { 
      header: 'Projet', 
      key: 'nom',
      render: (val, item) => (
        <div className="flex flex-col">
          <span className="font-black text-foreground">{val}</span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
            <MapPin size={10} /> {item.commune_nom}
          </span>
        </div>
      )
    },
    { 
      header: 'Budget Alloué', 
      key: 'budget_alloue_fcfa',
      render: (val) => <span className="font-black text-primary">{formatFCFA(val)}</span>
    },
    {
      header: 'Exécution',
      key: 'taux_execution',
      render: (val) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${val}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-foreground">{val}%</span>
        </div>
      )
    },
    {
      header: 'Statut',
      key: 'statut',
      render: (val) => (
        <Badge 
          variant={val === 'ACHEVE' ? 'success' : val === 'EN_COURS' ? 'default' : 'secondary'} 
          className="rounded-full px-3 font-bold"
        >
          {val.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: () => (
        <Button variant="ghost" size="sm" className="font-bold hover:text-primary rounded-xl">Suivi</Button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement de votre portefeuille...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Portefeuille de Projets</h2>
          <p className="text-muted-foreground mt-2 font-medium text-sm">Suivi des infrastructures et projets parrainés.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-base transition-all hover:scale-[1.02] active:scale-95">
          <Plus className="w-5 h-5 mr-2" />
          Financer un projet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Projets Financés" value={projets.length} icon={<Briefcase className="text-primary" />} />
        <StatsCard label="Budget Engagé" value={formatFCFA(totalBudget)} icon={<TrendingUp className="text-emerald-500" />} />
        <StatsCard label="Taux de Complétion" value={`${avgExecution.toFixed(1)}%`} icon={<CheckCircle2 className="text-blue-500" />} />
      </div>

      <DataTable 
        title="Liste des Projets"
        columns={columns}
        data={projets}
      />
    </div>
  );
}
