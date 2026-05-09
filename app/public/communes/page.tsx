"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Search, Loader2, MapPin, ChevronRight } from "lucide-react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatFCFA } from "@/lib/constants";

export default function PublicCommunesPage() {
  const [search, setSearch] = useState("");
  const { communes: allCommunes, loading } = useCommunesList();
  const filtered = allCommunes.filter((c: any) =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
             <Globe className="text-primary" /> Répertoire Citoyen
          </h2>
          <p className="text-muted-foreground mt-2 font-medium italic">
             Consultez les indicateurs de performance des {allCommunes.length} communes de Côte d&apos;Ivoire en toute transparence.
          </p>
        </div>
      </div>

      <Card className="shadow-lg border-border rounded-[24px] overflow-hidden bg-card/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Rechercher votre commune (ex: Abobo, San-Pédro)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 text-sm font-bold bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border bg-card/50 backdrop-blur-xl">
        <CardHeader className="bg-muted/30 border-b border-border p-8">
          <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-foreground italic">
            <MapPin className="w-5 h-5 text-primary" />
            Collectivités Territoriales ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Commune</th>
                  <th className="text-left px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell italic">Région</th>
                  <th className="text-right px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Budget Annuel</th>
                  <th className="text-right px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Exécution</th>
                  <th className="text-right px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronisation du registre national...</span>
                       </div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-all group border-l-4 border-l-transparent hover:border-l-primary cursor-pointer">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <p className="font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{c.nom}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter sm:hidden italic">{c.region}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-muted-foreground hidden sm:table-cell uppercase tracking-widest italic">{c.region}</td>
                    <td className="px-4 py-4 text-right font-black text-foreground tabular-nums">{formatFCFA(c.budget_annuel_fcfa)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden border border-border shadow-inner">
                           <div 
                             className="h-full bg-primary transition-all duration-1000" 
                             style={{ width: `${c.budget_annuel_fcfa > 0 ? (c.budget_depense_fcfa / c.budget_annuel_fcfa) * 100 : 0}%` }} 
                           />
                        </div>
                        <span className="text-xs font-black text-foreground tabular-nums">
                          {c.budget_annuel_fcfa > 0 ? ((c.budget_depense_fcfa / c.budget_annuel_fcfa) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-4">
                        <Badge variant={c.score_transparence >= 70 ? "success" : c.score_transparence >= 50 ? "warning" : "destructive"} className="rounded-lg h-7 px-3 font-black text-[10px]">
                          {c.score_transparence}/100
                        </Badge>
                        <Link href={`/public/communes/${c.id}`}>
                          <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white border border-primary/20">
                            <ChevronRight size={18} />
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
