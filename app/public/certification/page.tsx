"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Upload, CheckCircle2, AlertTriangle,
  FileText, User, Loader2, ArrowLeft, Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Step = "intro" | "identity" | "document" | "success";

export default function CertificationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState({ cni_numero: "", cni_date: "", selfie_url: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    // Simule l'envoi d'une demande de certification
    // Dans la vraie implémentation : POST /api/auth/certification/
    await new Promise(r => setTimeout(r, 1500));
    setStep("success");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <Link href="/public/dashboard" className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-widest hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Certification Sentinelle</h1>
        <p className="text-muted-foreground mt-2 font-medium text-sm">
          Vérifiez votre identité pour débloquer les actions citoyennes protégées.
        </p>
      </div>

      {/* Stepper */}
      {step !== "success" && (
        <div className="flex items-center gap-2">
          {(["intro", "identity", "document"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === s ? "bg-primary text-white shadow-lg shadow-primary/20" :
                ["intro","identity","document"].indexOf(step) > i ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              {i < 2 && <div className="w-12 h-0.5 bg-border" />}
            </div>
          ))}
          <span className="ml-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {step === "intro" ? "Présentation" : step === "identity" ? "Votre Identité" : "Document"}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg mb-2">Pourquoi se certifier ?</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      KOMOE est une infrastructure blockchain publique. Pour protéger l'intégrité des données
                      contre les faux signalements (Anti-Sybil), chaque action sensible requiert une identité vérifiée.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: User, title: "Signaler une anomalie", desc: "Votre signalement sera certifié sur la blockchain." },
                { icon: Sparkles, title: "Gagner des points", desc: "Débloquez votre réputation de Gardien." },
                { icon: FileText, title: "Accès aux exports", desc: "Téléchargez les données budgétaires complètes." },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                  <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-black text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => setStep("identity")} className="w-full h-12 font-black uppercase tracking-widest">
              Commencer ma certification →
            </Button>
          </motion.div>
        )}

        {step === "identity" && (
          <motion.div key="identity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card>
              <CardContent className="p-8 space-y-6">
                <h2 className="font-black text-xl">Vos informations d'identité</h2>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-amber-700">
                    Ces informations sont chiffrées et ne sont utilisées que pour valider votre identité ivoirienne.
                    Elles ne sont jamais partagées publiquement.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-1.5">Nom complet (tel que sur la CNI)</label>
                    <input
                      type="text" defaultValue={user ? `${user.prenom} ${user.nom}` : ""}
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-1.5">Numéro CNI / Passeport</label>
                    <input
                      type="text" placeholder="ex: CI0123456789"
                      value={form.cni_numero} onChange={e => setForm(f => ({ ...f, cni_numero: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-1.5">Date d'expiration du document</label>
                    <input
                      type="date"
                      value={form.cni_date} onChange={e => setForm(f => ({ ...f, cni_date: e.target.value }))}
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("intro")} className="flex-1">← Retour</Button>
                  <Button
                    onClick={() => { if (form.cni_numero) setStep("document"); }}
                    disabled={!form.cni_numero}
                    className="flex-1 font-black"
                  >
                    Continuer →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "document" && (
          <motion.div key="document" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <form onSubmit={handleSubmit}>
              <Card>
                <CardContent className="p-8 space-y-6">
                  <h2 className="font-black text-xl">Téléversez votre document</h2>

                  <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center space-y-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-black text-sm">Photo de votre CNI recto/verso</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou PDF — Max 5 Mo</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="font-bold">
                      Choisir un fichier
                    </Button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">{error}</div>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep("identity")} className="flex-1">← Retour</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 font-black">
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Envoi...</> : "Soumettre ma demande"}
                    </Button>
                  </div>

                  <p className="text-center text-[10px] text-muted-foreground font-medium">
                    La vérification est effectuée par l'équipe KOMOE sous 24–48h.
                  </p>
                </CardContent>
              </Card>
            </form>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-8">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-3">Demande Soumise !</h2>
              <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto leading-relaxed">
                Votre demande de certification Sentinelle a été enregistrée.
                Vous recevrez une notification par email dans 24–48h.
              </p>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl max-w-sm mx-auto">
              <p className="text-xs font-black uppercase text-primary tracking-widest">En attendant, vous pouvez</p>
              <p className="text-sm text-muted-foreground mt-1">Consulter les budgets publics et suivre les transactions validées.</p>
            </div>
            <Button onClick={() => router.push("/public/dashboard")} className="h-12 px-10 font-black">
              Retour au Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
