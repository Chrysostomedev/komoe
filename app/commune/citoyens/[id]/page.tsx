"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, User, MapPin, CheckCircle, Clock, Loader2, ShieldCheck, Mail, Phone, Calendar, Activity } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi, UserProfile } from "@/lib/api";
import { formatDateShort } from "@/lib/constants";

export default function CitoyenDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [citoyen, setCitoyen] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCitoyen = async () => {
      try {
        const data = await authApi.detail(id);
        setCitoyen(data);
      } catch (err: any) {
        setError(err.message || "Citoyen introuvable");
      } finally {
        setLoading(false);
      }
    };
    fetchCitoyen();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement du profil citoyen...</p>
    </div>
  );

  if (error || !citoyen) return (
    <div className="max-w-4xl mx-auto py-20 text-center">
      <p className="text-xl font-black text-destructive italic">{error || "Citoyen introuvable"}</p>
      <Link href="/commune/citoyens">
        <Button variant="ghost" className="mt-4 font-bold">Retour au registre</Button>
      </Link>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
      <Link href="/commune/citoyens" className="inline-flex items-center text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour au registre citoyen
      </Link>

      <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden mb-12 bg-card/50 backdrop-blur-xl border relative">
        <div className="h-48 bg-gradient-to-br from-primary via-primary/80 to-accent relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="absolute -bottom-1 -left-1 -right-1 h-24 bg-gradient-to-t from-card to-transparent"></div>
        </div>
        
        <CardContent className="p-10 pt-0 relative">
          <div className="absolute -top-16 left-10">
            <div className="w-32 h-32 bg-card rounded-[32px] shadow-2xl flex items-center justify-center text-5xl font-black text-primary border-4 border-card ring-1 ring-border">
               {citoyen.avatar ? (
                 <img src={citoyen.avatar} alt={citoyen.nom} className="w-full h-full object-cover rounded-[28px]" />
               ) : (
                 citoyen.prenom.slice(0, 1) + citoyen.nom.slice(0, 1)
               )}
            </div>
          </div>
          
          <div className="mt-20 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-foreground tracking-tight uppercase italic">{citoyen.prenom} {citoyen.nom}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest italic">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {citoyen.commune_nom || "Résident local"}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> Inscrit le {formatDateShort(citoyen.date_joined)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
               <Badge variant={citoyen.reputation_score > 50 ? "success" : "warning"} className="h-10 px-6 rounded-2xl font-black text-xs shadow-xl shadow-primary/5">
                 {citoyen.reputation_score > 50 ? "IDENTITÉ VÉRIFIÉE (KYC)" : "EN ATTENTE DE VÉRIFICATION"}
               </Badge>
               <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-tighter italic">
                 ID: {citoyen.id.slice(0, 12)}...
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6 bg-muted/30 rounded-[28px] border border-border/50 group hover:border-primary/30 transition-all">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2 group-hover:text-primary transition-colors">
                <Mail size={12} /> Contact Email
              </p>
              <p className="font-bold text-foreground break-all">{citoyen.email}</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-[28px] border border-border/50 group hover:border-primary/30 transition-all">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2 group-hover:text-primary transition-colors">
                <Phone size={12} /> Téléphone
              </p>
              <p className="font-bold text-foreground">{citoyen.telephone || "Non renseigné"}</p>
            </div>
            <div className="p-6 bg-primary/5 rounded-[28px] border border-primary/20 group transition-all">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={14} /> Score Réputation
              </p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-primary tabular-nums leading-none">{citoyen.reputation_score}</span>
                <span className="text-xs font-bold text-primary/40 uppercase mb-1">points</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
             <Activity className="text-primary" /> Historique d&apos;engagement
          </h3>
          <div className="space-y-4">
            <div className="flex gap-6 items-start p-6 bg-card border border-border rounded-[32px] shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/50 group-hover:scale-110 transition-transform">
                <CheckCircle size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">A voté pour le projet &quot;Rénovation École Primaire&quot;</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic opacity-60">Le 20 Mars 2026 · Preuve Blockchain Scellée</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start p-6 bg-card border border-border rounded-[32px] shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">A signalé &quot;Nid de poule dangereux&quot;</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic opacity-60">Le 18 Février 2026 · Incident en cours de traitement</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
             <ShieldCheck className="text-primary" /> Sécurité & Statut
           </h3>
           <Card className="rounded-[32px] border border-border bg-muted/10 p-6 space-y-6">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Compte Actif</span>
                 <Badge variant="success" className="h-6 rounded-full font-bold">OUI</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Signature Web3</span>
                 <Badge variant={citoyen.is_blockchain_authorized ? "success" : "secondary"} className="h-6 rounded-full font-bold">
                   {citoyen.is_blockchain_authorized ? "ACTIVE" : "INACTIVE"}
                 </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Journaliste</span>
                 <Badge variant={citoyen.journaliste_verifie ? "success" : "secondary"} className="h-6 rounded-full font-bold">
                   {citoyen.journaliste_verifie ? "OUI" : "NON"}
                 </Badge>
              </div>
           </Card>

           <div className="p-6 bg-accent/10 border border-accent/20 rounded-[32px] space-y-3">
              <p className="text-xs font-black text-accent uppercase tracking-widest">Note Administrative</p>
              <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                Ce citoyen participe activement à la vie démocratique de la commune. Son score de réputation reflète l&apos;exactitude de ses signalements passés.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
