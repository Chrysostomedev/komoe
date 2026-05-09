"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, AlertTriangle, MapPin, Calendar, Users, Camera, CheckCircle2, Download, Loader2 } from "lucide-react";
import { signalementsApi, type Signalement } from "@/lib/api";

export default function SignalementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await signalementsApi.detail(id);
      setSignalement(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleProcess = async () => {
    if (!signalement || !confirm("Confirmer le traitement de ce signalement ?")) return;
    setIsProcessing(true);
    try {
      await signalementsApi.update(id, { is_reviewed: true });
      fetchDetail();
    } catch (err: any) {
      alert("Erreur: " + (err.message || "Échec"));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Récupération des pièces jointes...</p>
    </div>
  );

  if (!signalement) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <div className="bg-red-50 p-8 rounded-[32px] border border-red-100">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-foreground">Signalement introuvable</h3>
        <Link href="/commune/signalements">
          <Button className="mt-6">Retour</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <Link href="/commune/signalements" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-10 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour au flux
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-foreground tracking-tight uppercase italic">{signalement.sujet}</h2>
            <Badge variant={signalement.is_reviewed ? "success" : "secondary"} className="h-8 px-4 rounded-full font-black text-[10px] uppercase">
              {signalement.is_reviewed ? "TRAITÉ" : "EN ATTENTE D'ACTION"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold text-xs uppercase tracking-widest italic">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {signalement.commune_detail?.nom || "Localisation non précisée"}</span>
            <span className="flex items-center gap-2"><Calendar size={16} className="text-primary" /> Signalé le {new Date(signalement.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
          </div>
        </div>
        <div className="flex flex-col items-center p-6 bg-primary/5 rounded-[32px] border border-primary/10 shadow-xl shadow-primary/5 min-w-[120px]">
          <span className="text-4xl font-black text-primary">1</span>
          <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-1">Alerte</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
          <CardContent className="p-10">
            <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight italic flex items-center gap-3">
               <Users className="text-primary" size={20} /> Détails de l'incident
            </h3>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed font-medium italic mb-10" dangerouslySetInnerHTML={{ __html: signalement.description }} />
            
            <div className="pt-10 border-t border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 italic">Citoyen émetteur</p>
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-[24px] border border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Users size={24} /></div>
                <div>
                  <p className="font-black text-foreground uppercase text-xs">{signalement.auteur_detail?.full_name || "Anonyme"}</p>
                  <p className="text-[10px] text-muted-foreground font-bold italic">Compte Citoyen Certifié</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
            <CardContent className="p-10">
              <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight italic flex items-center gap-3">
                <Camera className="text-primary" size={20} /> Pièces Jointes
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="aspect-video bg-muted/50 rounded-[32px] flex flex-col items-center justify-center border-2 border-dashed border-border group hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative">
                   <Camera className="text-muted-foreground group-hover:scale-110 transition-transform" size={48} />
                   <div className="mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Image_Preuve_01.jpg</div>
                   
                   <div className="absolute inset-0 bg-primary/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all p-6 text-center">
                      <p className="text-white text-xs font-black uppercase tracking-widest mb-4">Certifié sur IPFS</p>
                      <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-xl font-black uppercase text-[10px] h-10 shadow-2xl">
                         <Download size={14} className="mr-2" /> Télécharger preuve
                      </Button>
                   </div>
                </div>
              </div>
              <p className="mt-6 text-[10px] text-muted-foreground font-bold italic leading-relaxed text-center">
                Les photos jointes sont stockées de manière décentralisée sur IPFS pour garantir qu'elles ne soient pas modifiées après le signalement.
              </p>
            </CardContent>
          </Card>

          {!signalement.is_reviewed && (
            <Button 
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black uppercase italic shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
              Marquer comme traité
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
