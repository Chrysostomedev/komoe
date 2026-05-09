"use client";

import { useCommunesList } from "@/lib/hooks/useCommunes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, TrendingUp, TrendingDown, Minus, Loader2, Globe } from "lucide-react";
import { formatFCFA } from "@/lib/constants";

// Simuler des coordonnées par région pour une visualisation textuelle
// En production: utiliser react-leaflet + GeoJSON des 201 communes CI
const REGIONS_CI = [
  "Abidjan", "Bas-Sassandra", "Comoé", "Denguélé", "Gôh-Djiboua",
  "Lacs", "Lagunes", "Marahoué", "Montagnes", "Sassandra-Marahoué",
  "Savanes", "Vallée du Bandama", "Woroba", "Yamoussoukro", "Zanzan",
];

export default function CartePage() {
  const { communes, loading } = useCommunesList();

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  const getColor = (score: number) => {
    if (score >= 70) return { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", hex: "#10b981" };
    if (score >= 50) return { bg: "bg-amber-500", text: "text-white", border: "border-amber-600", hex: "#f59e0b" };
    return { bg: "bg-rose-500", text: "text-white", border: "border-rose-600", hex: "#ef4444" };
  };

  const getIcon = (score: number) => {
    if (score >= 70) return <TrendingUp size={12} />;
    if (score >= 50) return <Minus size={12} />;
    return <TrendingDown size={12} />;
  };

  const topRegions = REGIONS_CI.map(region => {
    const regionCommunes = communes.filter(c => c.region === region);
    const avgScore = regionCommunes.length > 0
      ? Math.round(regionCommunes.reduce((s, c) => s + c.score_transparence, 0) / regionCommunes.length)
      : 0;
    return { region, nb: regionCommunes.length, avgScore, communes: regionCommunes };
  }).filter(r => r.nb > 0).sort((a, b) => b.avgScore - a.avgScore);

  const avg = communes.length > 0
    ? Math.round(communes.reduce((s, c) => s + c.score_transparence, 0) / communes.length)
    : 0;

  const niveauNational = avg >= 70 ? "Bon" : avg >= 50 ? "Moyen" : "Critique";
  const niveauColor = avg >= 70 ? "text-emerald-600" : avg >= 50 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-lg w-max mb-4 border border-primary/20">
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Carte Nationale</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Transparence par Région</h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Vue thermique de la transparence budgétaire des {communes.length} communes de Côte d&apos;Ivoire.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-muted/50 p-4 rounded-2xl border border-border text-center">
            <p className={`text-3xl font-black ${niveauColor}`}>{avg}/100</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase">Score national</p>
            <p className={`text-xs font-bold mt-1 ${niveauColor}`}>{niveauNational}</p>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-card border border-border rounded-2xl">
        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Légende :</span>
        {[
          { label: "Excellent (≥70)", color: "bg-emerald-500" },
          { label: "Moyen (50-69)", color: "bg-amber-500" },
          { label: "Critique (<50)", color: "bg-rose-500" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${l.color}`} />
            <span className="text-xs font-bold">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grille des régions — Carte de chaleur */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Score par région — {topRegions.length} régions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {topRegions.map(r => {
            const col = getColor(r.avgScore);
            return (
              <div key={r.region} className={`relative rounded-[20px] p-5 ${col.bg} ${col.text} ${col.border} border-2 shadow-lg hover:scale-105 transition-all cursor-pointer`}>
                <div className="flex items-start justify-between mb-3">
                  <MapPin size={16} className="opacity-80 shrink-0" />
                  <div className="flex items-center gap-1 opacity-80">
                    {getIcon(r.avgScore)}
                  </div>
                </div>
                <p className="text-lg font-black leading-tight">{r.avgScore}</p>
                <p className="text-[9px] font-black opacity-80 uppercase tracking-widest">/ 100</p>
                <p className="text-xs font-black mt-2 truncate">{r.region}</p>
                <p className="text-[9px] opacity-70 mt-0.5">{r.nb} commune{r.nb > 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top & Bas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[28px] border-emerald-200 bg-emerald-50/30 shadow-xl">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-emerald-700 font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <TrendingUp size={16} /> Top 10 Communes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            {[...communes].sort((a, b) => b.score_transparence - a.score_transparence).slice(0, 10).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground w-5 text-right">{i + 1}.</span>
                <div className="flex-1 bg-muted/50 rounded-xl h-7 overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-500 rounded-xl transition-all duration-1000"
                    style={{ width: `${c.score_transparence}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-[10px] font-black text-foreground">{c.nom}</span>
                </div>
                <span className="text-xs font-black text-emerald-700 w-8">{c.score_transparence}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-rose-200 bg-rose-50/30 shadow-xl">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-rose-700 font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <TrendingDown size={16} /> Zone de Vigilance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            {[...communes].sort((a, b) => a.score_transparence - b.score_transparence).slice(0, 10).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground w-5 text-right">{i + 1}.</span>
                <div className="flex-1 bg-muted/50 rounded-xl h-7 overflow-hidden relative">
                  <div
                    className="h-full bg-rose-500 rounded-xl transition-all duration-1000"
                    style={{ width: `${Math.max(c.score_transparence, 5)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-[10px] font-black text-foreground">{c.nom}</span>
                </div>
                <span className="text-xs font-black text-rose-700 w-8">{c.score_transparence}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Grille complète des communes */}
      <Card className="rounded-[32px] border border-border shadow-xl overflow-hidden">
        <CardHeader className="p-6 border-b border-border bg-muted/30">
          <CardTitle className="font-black uppercase tracking-widest text-sm">Toutes les communes ({communes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
            {[...communes].sort((a, b) => b.score_transparence - a.score_transparence).map(c => {
              const col = getColor(c.score_transparence);
              return (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className={`w-3 h-3 rounded-full ${col.bg} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{c.nom}</p>
                    <p className="text-[10px] text-muted-foreground">{c.region}</p>
                  </div>
                  <span className={`text-xs font-black ${col.bg === "bg-emerald-500" ? "text-emerald-600" : col.bg === "bg-amber-500" ? "text-amber-600" : "text-rose-600"}`}>
                    {c.score_transparence}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
