"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { formatFCFA } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const scoreVariant = (score: number) => {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "destructive";
};

const scoreTrend = (score: number) => {
  if (score >= 80) return <TrendingUp className="text-emerald-500 w-4 h-4" />;
  if (score >= 50) return <Minus className="text-amber-500 w-4 h-4" />;
  return <TrendingDown className="text-rose-500 w-4 h-4" />;
};

export default function CommunesPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("Tous");
  const { communes: allCommunes, loading } = useCommunesList();

  const regions = ["Tous", ...Array.from(new Set(allCommunes.map((c: any) => c.region)))];

  const filtered = allCommunes.filter((c: any) => {
    const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === "Tous" || c.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const totalBudget = allCommunes.reduce((s: number, c: any) => s + c.budget_annuel_fcfa, 0);
  const totalDepense = allCommunes.reduce((s: number, c: any) => s + c.budget_depense_fcfa, 0);
  const avgScore = allCommunes.length > 0
    ? Math.round(allCommunes.reduce((s: number, c: any) => s + c.score_transparence, 0) / allCommunes.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight uppercase italic">Répertoire National des Communes</h2>
        <p className="text-muted-foreground mt-1 text-sm italic">Audit et suivi consolidé des {allCommunes.length} communes de Côte d&apos;Ivoire.</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-xl shadow-primary/5 border-border/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 italic">Budget National Alloué</p>
            <p className="text-2xl font-black text-foreground tabular-nums">{loading ? '…' : formatFCFA(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-xl shadow-primary/5 border-border/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 italic">Dépenses Consolidées</p>
            <p className="text-2xl font-black text-foreground tabular-nums">{loading ? '…' : formatFCFA(totalDepense)}</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase mt-2 italic">{totalBudget > 0 ? ((totalDepense / totalBudget) * 100).toFixed(1) : 0}% du budget consommé</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-xl shadow-primary/5 border-border/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 italic">Score Moyen Transparence</p>
            <p className="text-2xl font-black text-primary tabular-nums">{loading ? '…' : `${avgScore}/100`}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="rounded-[24px] border-border shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une commune (ex: Cocody, Bouaké)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-xs font-bold border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 bg-card/50 transition-all"
              />
            </div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-4 py-3 text-xs font-black border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 bg-card/50 transition-all uppercase italic"
            >
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="rounded-[32px] overflow-hidden border border-border shadow-2xl bg-card/50 backdrop-blur-xl">
        <CardHeader className="bg-muted/30 border-b border-border p-6">
          <CardTitle className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground italic">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span>Registre d'Audit National</span>
            </div>
            <span className="text-primary">{filtered.length} Communes filtrées</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Commune</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell italic">District / Région</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Budget Primitif</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell italic">Exécution</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Transparence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-black uppercase tracking-widest animate-pulse">Synchronisation des données nationales...</td></tr>
                )}
                {!loading && filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-[10px] group-hover:bg-primary group-hover:text-white transition-all border border-primary/10 shadow-sm">
                          {c.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-foreground group-hover:text-primary transition-colors">{c.nom}</p>
                          <p className="text-[10px] text-muted-foreground font-bold italic">{c.region}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground hidden sm:table-cell italic">{c.region}</td>
                    <td className="px-6 py-4 text-right font-black text-foreground tabular-nums">{formatFCFA(c.budget_annuel_fcfa)}</td>
                    <td className="px-6 py-4 text-right hidden md:table-cell">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-xs font-black text-foreground tabular-nums">{formatFCFA(c.budget_depense_fcfa)}</span>
                        <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden border border-border shadow-inner">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(c.budget_annuel_fcfa > 0 ? (c.budget_depense_fcfa / c.budget_annuel_fcfa) * 100 : 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center gap-1.5">
                          {scoreTrend(c.score_transparence)}
                          <Badge variant={scoreVariant(c.score_transparence)} className="font-black rounded-lg h-7 px-3 text-[10px]">
                            {c.score_transparence}/100
                          </Badge>
                        </div>
                        <Link href={`/controle/communes/${c.id}`}>
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white border border-primary/20">
                            <ChevronRight size={20} />
                          </div>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
