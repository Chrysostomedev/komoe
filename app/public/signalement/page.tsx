"use client";

import { useState } from "react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { signalementsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/ReusableForm";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldAlert, Send, CheckCircle2, AlertTriangle, Zap, Building2, MessageSquareText } from "lucide-react";

const CATEGORIES = ["Dépense suspecte", "Montant anormal", "Transaction sans justificatif", "Retard de publication", "Autre anomalie"];

export default function SignalementPage() {
  const { communes } = useCommunesList();
  const [form, setForm] = useState({ categorie: "", description: "", communeId: "", sujet: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.communeId) return;
    setLoading(true);
    setError(null);
    try {
      await signalementsApi.create({
        commune: Number(form.communeId),
        sujet: form.sujet || form.categorie || "Anomalie",
        description: form.description,
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erreur lors de l'envoi du signalement.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-black text-foreground tracking-tight uppercase italic text-center">Engagement enregistré</h3>
        <p className="text-muted-foreground mt-4 text-center max-w-md font-medium leading-relaxed">
          Votre signalement a été transmis en toute confidentialité aux autorités compétentes (DGDDL & Cour des Comptes). 
          Votre vigilance contribue à une meilleure gestion du bien public.
        </p>
        <Button
          onClick={() => { setForm({ categorie: "", description: "", communeId: "", sujet: "" }); setSubmitted(false); }}
          className="mt-10 h-14 px-10 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          Nouveau signalement
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-lg w-max mb-4 border border-amber-500/20">
             <AlertTriangle size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Alerte Transparence</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
             <ShieldAlert className="text-amber-500" /> Signaler une anomalie
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
             Participez à la surveillance citoyenne. Votre signalement est anonyme et transmis aux régulateurs nationaux.
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-2 px-4 rounded-xl flex items-center gap-2">
           <Zap size={14} className="fill-primary" /> Sécurisé par KOMOE
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border">
            <CardHeader className="p-8 border-b border-border bg-muted/30">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground">Détails de l'anomalie</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                   <AlertTriangle size={14} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Type d'anomalie" required>
                    <Select
                      required
                      value={form.categorie}
                      onChange={(e: any) => setForm({ ...form, categorie: e.target.value })}
                      disabled={loading}
                    >
                      <option value="">Choisir...</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </FormField>

                  <FormField label="Collectivité concernée" required>
                    <div className="relative">
                      <Select
                        required
                        value={form.communeId}
                        onChange={(e: any) => setForm({ ...form, communeId: e.target.value })}
                        disabled={loading}
                        className="pl-10"
                      >
                        <option value="">Sélectionner la commune...</option>
                        {communes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </Select>
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormField>
                </div>

                <FormField label="Sujet de votre alerte" required>
                  <Input
                    required
                    type="text"
                    placeholder="Ex: Facturation suspecte d'un marché public"
                    value={form.sujet}
                    onChange={(e: any) => setForm({ ...form, sujet: e.target.value })}
                    disabled={loading}
                  />
                </FormField>

                <FormField label="Description détaillée" required>
                  <div className="relative">
                    <textarea
                      required
                      rows={6}
                      placeholder="Apportez le plus de précisions possible (lieux, dates, montants observés)..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      disabled={loading}
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 pl-10 text-foreground dark:text-white placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                    <MessageSquareText size={16} className="absolute left-3 top-4 text-muted-foreground" />
                  </div>
                </FormField>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                  {loading ? "Transmission..." : "Soumettre le signalement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[32px] border-border shadow-xl bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-8">
              <h4 className="text-sm font-black uppercase text-amber-600 mb-4 flex items-center gap-2">
                <ShieldAlert size={16} /> Confidentialité Totale
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Votre adresse IP et votre identité ne sont jamais liées à ce signalement. KOMOE utilise des protocoles de transmission sécurisés pour garantir votre anonymat. 
                Seuls le contenu de l'alerte et la commune ciblée sont transmis pour investigation.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border shadow-xl">
            <CardContent className="p-8">
              <h4 className="text-sm font-black uppercase text-foreground mb-4">Processus d'audit</h4>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                {[
                  { t: "Réception", d: "Enregistrement cryptographique" },
                  { t: "Vérification", d: "Analyse des données blockchain" },
                  { t: "Action", d: "Audit officiel DGDDL" }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black z-10 shrink-0">
                      {i+1}
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">{s.t}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

