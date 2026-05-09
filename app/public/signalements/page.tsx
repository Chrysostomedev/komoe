"use client";

import { useState, useEffect } from "react";
import { signalementsApi, type Signalement } from "@/lib/api";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, Loader2, Building2, Clock, CheckCircle2, AlertTriangle, ExternalLink, Search } from "lucide-react";
import { formatDateShort } from "@/lib/constants";
import Link from "next/link";

export default function SignalementsPublicsPage() {
  const { communes } = useCommunesList();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await signalementsApi.list({
          commune: selectedCommune ? Number(selectedCommune) : undefined,
        });
        setSignalements(res.results ?? []);
      } catch {
        setSignalements([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedCommune]);

  const filtered = signalements.filter(s =>
    s.sujet.toLowerCase().includes(search.toLowerCase()) ||
    (s.commune_detail?.nom ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const enAttente = filtered.filter(s => !s.is_reviewed).length;
  const traites = filtered.filter(s => s.is_reviewed).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-lg w-max mb-4 border border-amber-500/20">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Transparence Communautaire</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Signalements Citoyens</h2>
          <p className="text-muted-foreground mt-2 font-medium">Toutes les anomalies signalées par la communauté et leur statut de traitement.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-200 text-center">
            <p className="text-2xl font-black text-amber-600">{enAttente}</p>
            <p className="text-[10px] font-black text-amber-700 uppercase">En attente</p>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200 text-center">
            <p className="text-2xl font-black text-emerald-600">{traites}</p>
            <p className="text-[10px] font-black text-emerald-700 uppercase">Traités</p>
          </div>
        </div>
      </div>

      {/* CTA Signaler */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-black text-foreground">Vous avez observé une anomalie ?</p>
          <p className="text-sm text-muted-foreground mt-1">Signalez-la maintenant avec des preuves photos pour +10 points de réputation.</p>
        </div>
        <Link href="/public/signalement">
          <Button className="bg-primary text-white rounded-xl h-12 px-6 font-black shadow-lg shadow-primary/20 whitespace-nowrap">
            <ShieldAlert size={16} className="mr-2" /> Signaler une anomalie
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un signalement..."
            className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={selectedCommune} onChange={e => setSelectedCommune(e.target.value)}
          className="bg-card border border-border rounded-2xl px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[200px]">
          <option value="">Toutes les communes</option>
          {communes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">Aucun signalement trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => (
            <Card key={s.id} className="rounded-[24px] border border-border hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {s.is_reviewed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-black">
                          <CheckCircle2 size={10} className="mr-1" /> Traité
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] font-black">
                          <AlertTriangle size={10} className="mr-1" /> En attente
                        </Badge>
                      )}
                      {s.commune_detail && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                          <Building2 size={11} /> {s.commune_detail.nom}
                        </span>
                      )}
                      {(s as any).nb_preuves > 0 && (
                        <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 text-[10px] font-black">
                          📎 {(s as any).nb_preuves} preuve(s) IPFS
                        </Badge>
                      )}
                      {s.transaction && (
                        <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-[10px] font-black">
                          🔗 Transaction ciblée
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-black text-foreground">{s.sujet}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {formatDateShort(s.created_at)}
                    </p>
                  </div>
                  {s.transaction && (
                    <Link href={`/public/verifier?hash=${s.transaction}`}>
                      <Button variant="outline" className="rounded-xl h-9 px-4 text-[10px] font-bold flex items-center gap-1.5">
                        <ExternalLink size={12} /> Voir transaction
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
