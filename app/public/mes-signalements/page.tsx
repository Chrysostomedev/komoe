"use client";

import { useState, useEffect } from "react";
import { signalementsApi, type Signalement } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, Loader2, Building2, Clock, CheckCircle2, AlertTriangle, Plus, Star } from "lucide-react";
import { formatDateShort } from "@/lib/constants";
import Link from "next/link";

const BADGE_RANG = (score: number) => {
  if (score >= 500) return { label: "Champion de la Transparence 🏆", color: "bg-amber-500/10 text-amber-700 border-amber-500/20" };
  if (score >= 200) return { label: "Gardien 🛡️", color: "bg-purple-500/10 text-purple-700 border-purple-500/20" };
  if (score >= 50) return { label: "Sentinelle 👁️", color: "bg-primary/10 text-primary border-primary/20" };
  return { label: "Observateur 🔍", color: "bg-muted text-muted-foreground border-border" };
};

export default function MesSignalementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await signalementsApi.list({ mes_signalements: true });
        setSignalements(res.results ?? []);
      } catch {
        setSignalements([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, router]);

  if (!user) return null;

  const rang = BADGE_RANG(user.reputation_score ?? 0);
  const traites = signalements.filter(s => s.is_reviewed).length;
  const taux = signalements.length > 0 ? Math.round((traites / signalements.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Profil citoyen */}
      <div className="bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Mes Signalements</h2>
            <p className="text-muted-foreground mt-1 font-medium">Suivez l&apos;évolution de vos alertes citoyennes.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <Star className="text-amber-500 w-5 h-5 fill-amber-500" />
                <span className="text-3xl font-black text-foreground">{user.reputation_score ?? 0}</span>
              </div>
              <Badge className={`${rang.color} text-[10px] font-black border px-3 py-1 rounded-xl`}>{rang.label}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-2xl border border-border text-center">
            <p className="text-2xl font-black text-foreground">{signalements.length}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Soumis</p>
          </div>
          <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-200 text-center">
            <p className="text-2xl font-black text-emerald-600">{traites}</p>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Traités</p>
          </div>
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 text-center">
            <p className="text-2xl font-black text-primary">{taux}%</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Taux traitement</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link href="/public/signalement">
        <Button className="w-full h-14 bg-primary text-white rounded-[24px] font-black uppercase italic shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.01] transition-all">
          <Plus size={20} /> Nouveau signalement (+5 pts)
        </Button>
      </Link>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : signalements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">Aucun signalement soumis</p>
          <p className="text-sm mt-2">Devenez une Sentinelle citoyenne et signalez la première anomalie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {signalements.map(s => (
            <Card key={s.id} className="rounded-[24px] border border-border hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
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
                          📎 {(s as any).nb_preuves} preuve(s)
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-black text-foreground">{s.sujet}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> Soumis le {formatDateShort(s.created_at)}
                    </p>
                  </div>
                  {s.is_reviewed && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-black uppercase">Résolu</span>
                    </div>
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
