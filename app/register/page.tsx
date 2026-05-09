"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Users, Newspaper, Building, FlaskConical, Briefcase, ShieldCheck, CheckCircle2, ArrowRight, Globe, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api";

type Profession = "CITOYEN" | "JOURNALISTE" | "ONG" | "BAILLEUR" | "CHERCHEUR";
interface PublicCommune { id: number; nom: string; region: string; }


const PROFESSIONS: { value: Profession; label: string; icon: any; desc: string; benefits: string[]; color: string }[] = [
  { value: "CITOYEN",     label: "Citoyen",              icon: Users,       desc: "Gardien de ma commune",       color: "emerald",  benefits: ["Suivi du budget local", "Signalements citoyens", "Vote budgétaire participatif"] },
  { value: "JOURNALISTE", label: "Journaliste / Presse", icon: Newspaper,   desc: "Investigateur de données",    color: "blue",     benefits: ["Export CSV complet", "Accès API Open Data", "Alertes de transparence"] },
  { value: "ONG",         label: "ONG / Société civile", icon: Building,    desc: "Observateur d'intégrité",     color: "purple",   benefits: ["Tableaux d'audit consolidés", "Rapports d'impact", "Plaidoyer budgétaire"] },
  { value: "BAILLEUR",    label: "Bailleur de fonds",    icon: Briefcase,   desc: "Financeur de projets",        color: "amber",    benefits: ["Suivi des projets financés", "Taux d'exécution temps réel", "Alertes d'anomalie"] },
  { value: "CHERCHEUR",   label: "Analyste / Chercheur", icon: FlaskConical,desc: "Scientifique de données",     color: "rose",     benefits: ["Archives historiques complètes", "Données brutes blockchain", "API d'analyse avancée"] },
];

const COLOR_MAP: Record<string, string> = {
  emerald: "border-emerald-400 bg-emerald-400/10",
  blue:    "border-blue-400 bg-blue-400/10",
  purple:  "border-purple-400 bg-purple-400/10",
  amber:   "border-amber-400 bg-amber-400/10",
  rose:    "border-rose-400 bg-rose-400/10",
};
const COLOR_ICON: Record<string, string> = {
  emerald: "text-emerald-400", blue: "text-blue-400", purple: "text-purple-400", amber: "text-amber-400", rose: "text-rose-400",
};

const SECONDARY: { value: string; label: string; icon: any; desc: string }[] = [
  { value: "JOURNALISTE", label: "Je suis aussi Journaliste / Presse", icon: Newspaper, desc: "Module Open Data + export CSV" },
  { value: "BAILLEUR",    label: "Je suis aussi Bailleur de fonds",    icon: Briefcase, desc: "Module suivi de projets financés" },
  { value: "ONG",         label: "Je suis aussi dans une ONG",         icon: Building,  desc: "Module surveillance citoyenne" },
];

const INPUT  = "w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all";
const SELECT = "w-full bg-[#0d0d2b] border border-white/25 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer";
const LABEL  = "block text-[10px] font-black uppercase text-white/50 tracking-widest mb-1.5";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [communes, setCommunes] = useState<PublicCommune[]>([]);
  const [communesLoading, setCommunesLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/communes/?limit=300`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setCommunes(d.results ?? []))
      .catch(() => setCommunes([]))
      .finally(() => setCommunesLoading(false));
  }, []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profession, setProfession] = useState<Profession>("CITOYEN");
  const [secondary, setSecondary] = useState<string[]>([]);
  const [form, setForm] = useState({ email: "", nom: "", prenom: "", telephone: "", commune: "", date_naissance: "", media_organisation: "", password: "", password_confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upd = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const toggleSec = (val: string) =>
    setSecondary(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);

  const needsMedia = profession === "JOURNALISTE" || profession === "ONG" || secondary.includes("JOURNALISTE") || secondary.includes("ONG");

  const canGoStep3 = form.email && form.prenom && form.nom && form.password && form.password_confirm && form.commune;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({});
    if (form.password !== form.password_confirm) { setFieldErrors({ password_confirm: "Les mots de passe ne correspondent pas." }); return; }
    setIsSubmitting(true);
    try {
      await register({
        email: form.email, nom: form.nom, prenom: form.prenom,
        role: "CITOYEN", profession,
        password: form.password, password_confirm: form.password_confirm,
        telephone: form.telephone || undefined,
        commune: form.commune ? Number(form.commune) : undefined,
        date_naissance: form.date_naissance || undefined,
        media_organisation: needsMedia ? form.media_organisation : undefined,
        secondary_roles: secondary.length ? secondary : undefined,
      });
      router.push("/public/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.data && typeof apiErr.data === "object") {
        const f: Record<string, string> = {};
        for (const [k, v] of Object.entries(apiErr.data)) f[k] = Array.isArray(v) ? v.join(" ") : String(v);
        setFieldErrors(f);
      }
      setError(apiErr.message ?? "Erreur lors de la création du profil.");
    } finally { setIsSubmitting(false); }
  };

  const FE = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-[10px] font-bold text-red-400 mt-1">{fieldErrors[field]}</p> : null;

  const fade = { hidden: { opacity: 0, x: 16 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 } };
  const STEPS = ["Votre profil", "Vos informations", "Rôles supplémentaires"];
  const selectedProf = PROFESSIONS.find(p => p.value === profession)!;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 bg-[#070718] text-white overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">

        {/* ── LEFT COLUMN ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-4 flex flex-col justify-center py-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-black text-xl">K</span>
            </div>
            <span className="text-4xl font-black tracking-widest">KOMOE</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4 tracking-tight">
            Devenez une <span className="text-primary italic">Sentinelle</span> de la Transparence.
          </h1>
          <p className="text-white/50 font-medium leading-relaxed mb-8 text-sm">
            La première infrastructure de surveillance budgétaire citoyenne sur blockchain en Côte d'Ivoire.
          </p>

          <div className="space-y-3 mb-10">
            {[
              { icon: ShieldCheck, t: "Identité Vérifiée (Anti-Sybil)", d: "Signature cryptographique de vos actions." },
              { icon: Globe, t: "201 Communes couvertes", d: "Données budgétaires en temps réel." },
              { icon: Sparkles, t: "Réputation Citoyenne", d: "Gagnez des points en auditant votre commune." },
            ].map((x, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <x.icon className="w-4 h-4 text-primary" />
                </div>
                <div><p className="font-bold text-sm">{x.t}</p><p className="text-[11px] text-white/40">{x.d}</p></div>
              </div>
            ))}
          </div>

          {/* Step tracker */}
          <div className="space-y-1.5">
            {STEPS.map((s, i) => (
              <div key={i} className={cn("flex items-center gap-3 p-2.5 rounded-xl transition-all", step === i + 1 ? "bg-white/8" : "opacity-40")}>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                  step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-primary text-white" : "bg-white/10 text-white/50")}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-xs font-bold">{s}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT CARD ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-8">
          <Card className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]">
            <CardContent className="p-6 md:p-10">
              <AnimatePresence mode="wait">

                {/* ═══════════════ STEP 1 : Profil ═══════════════ */}
                {step === 1 && (
                  <motion.div key="s1" variants={fade} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }} className="space-y-6">
                    <div>
                      <h2 className="text-xl font-black italic uppercase tracking-tighter mb-1">Étape 1 — Choisissez votre profil</h2>
                      <p className="text-white/60 text-sm">Tous les utilisateurs commencent en tant que Citoyen. Quelle est votre identité principale ?</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PROFESSIONS.map(p => {
                        const Icon = p.icon;
                        const sel = profession === p.value;
                        return (
                          <button key={p.value} type="button" onClick={() => setProfession(p.value)}
                            className={cn(
                              "group p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer",
                              sel ? COLOR_MAP[p.color] : "bg-white/5 border-white/15 hover:bg-white/8 hover:border-white/30"
                            )}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                sel ? "bg-white/20" : "bg-white/10")}>
                                <Icon className={cn("w-5 h-5", sel ? COLOR_ICON[p.color] : "text-white/70")} />
                              </div>
                              <div>
                                <h3 className="font-black text-sm text-white leading-tight">{p.label}</h3>
                                <p className={cn("text-[10px] font-bold", sel ? "text-white/70" : "text-white/40")}>{p.desc}</p>
                              </div>
                              {sel && <CheckCircle2 className={cn("w-5 h-5 ml-auto shrink-0", COLOR_ICON[p.color])} />}
                            </div>
                            <ul className="space-y-1">
                              {p.benefits.map((b, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-[10px] font-medium text-white/70">
                                  <span className={cn("w-1 h-1 rounded-full shrink-0", sel ? COLOR_ICON[p.color].replace("text-", "bg-") : "bg-white/30")} />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </button>
                        );
                      })}
                    </div>

                    <Button onClick={() => setStep(2)} className="w-full h-12 bg-white text-[#070718] hover:bg-white/90 font-black uppercase tracking-widest group">
                      Continuer <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
                )}

                {/* ═══════════════ STEP 2 : Informations ═══════════════ */}
                {step === 2 && (
                  <motion.div key="s2" variants={fade} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-primary/80 tracking-widest hover:underline mb-2 block">← Retour</button>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">Étape 2 — Vos Informations</h2>
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg mt-6 shrink-0", COLOR_MAP[selectedProf.color], COLOR_ICON[selectedProf.color])}>
                        {selectedProf.label}
                      </span>
                    </div>

                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold text-center">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Prénom *</label>
                        <input type="text" value={form.prenom} onChange={upd("prenom")} required placeholder="Mamadou" className={INPUT} />
                        <FE field="prenom" />
                      </div>
                      <div>
                        <label className={LABEL}>Nom *</label>
                        <input type="text" value={form.nom} onChange={upd("nom")} required placeholder="Koné" className={INPUT} />
                        <FE field="nom" />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL}>Adresse email *</label>
                      <input type="email" value={form.email} onChange={upd("email")} required placeholder="vous@exemple.ci" className={INPUT} />
                      <FE field="email" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Téléphone</label>
                        <input type="tel" value={form.telephone} onChange={upd("telephone")} placeholder="+225 07 00 00 00 00" className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>Date de naissance</label>
                        <input type="date" value={form.date_naissance} onChange={upd("date_naissance")} className={INPUT} style={{ colorScheme: "dark" }} />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL}>Commune / Ville *</label>
                      {communesLoading ? (
                        <div className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl">
                          <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                          <span className="text-sm text-white/50">Chargement des communes...</span>
                        </div>
                      ) : (
                        <select value={form.commune} onChange={upd("commune")} required className={SELECT}>
                          <option value="" disabled className="text-white/40 bg-[#0d0d2b]">— Sélectionnez votre commune —</option>
                          {communes.sort((a, b) => a.nom.localeCompare(b.nom)).map(c => (
                            <option key={c.id} value={c.id} className="bg-[#0d0d2b] text-white">{c.nom} ({c.region})</option>
                          ))}
                        </select>
                      )}
                      <FE field="commune" />
                      {!communesLoading && communes.length > 0 && (
                        <p className="text-[10px] text-white/30 mt-1">{communes.length} communes disponibles</p>
                      )}
                    </div>

                    {needsMedia && (
                      <div>
                        <label className={LABEL}>{profession === "JOURNALISTE" || secondary.includes("JOURNALISTE") ? "Média / Rédaction *" : "Nom de l'Organisation *"}</label>
                        <input type="text" value={form.media_organisation} onChange={upd("media_organisation")}
                          placeholder={profession === "JOURNALISTE" ? "RTI, Fraternité Matin, freelance..." : "Nom de votre ONG / association"}
                          className={INPUT} />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Mot de passe *</label>
                        <div className="relative">
                          <input type={showPwd ? "text" : "password"} value={form.password} onChange={upd("password")} required placeholder="8 caractères min." className={INPUT + " pr-11"} />
                          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors">
                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <FE field="password" />
                      </div>
                      <div>
                        <label className={LABEL}>Confirmation *</label>
                        <input type="password" value={form.password_confirm} onChange={upd("password_confirm")} required placeholder="••••••••" className={INPUT} />
                        <FE field="password_confirm" />
                      </div>
                    </div>

                    <Button
                      onClick={() => { if (canGoStep3) setStep(3); }}
                      disabled={!canGoStep3}
                      className="w-full h-12 bg-white text-[#070718] hover:bg-white/90 font-black uppercase tracking-widest group disabled:opacity-40"
                    >
                      Continuer <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
                )}

                {/* ═══════════════ STEP 3 : Rôles supplémentaires ═══════════════ */}
                {step === 3 && (
                  <motion.div key="s3" variants={fade} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.25 }} className="space-y-6">
                    <div>
                      <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase text-primary/80 tracking-widest hover:underline mb-2 block">← Retour</button>
                      <h2 className="text-xl font-black italic uppercase tracking-tighter">Étape 3 — Rôles Supplémentaires</h2>
                      <p className="text-white/50 text-sm mt-1">Facultatif — Ces rôles révèlent des modules spécifiques sur votre tableau de bord. Ils seront débloqués après certification.</p>
                    </div>

                    <div className="space-y-3">
                      {SECONDARY.filter(r => r.value !== profession).map(r => {
                        const Icon = r.icon;
                        const active = secondary.includes(r.value);
                        return (
                          <button key={r.value} type="button" onClick={() => toggleSec(r.value)}
                            className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                              active ? "border-accent bg-accent/10" : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/8")}>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", active ? "bg-accent/20" : "bg-white/10")}>
                              <Icon className={cn("w-5 h-5", active ? "text-accent" : "text-white/60")} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-black text-sm", active ? "text-accent" : "text-white")}>{r.label}</p>
                              <p className="text-[11px] text-white/40 mt-0.5">{r.desc}</p>
                            </div>
                            <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                              active ? "border-accent bg-accent" : "border-white/25")}>
                              {active && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Récapitulatif */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Récapitulatif de votre profil</p>
                      <p className="text-sm font-bold text-white mb-2">{form.prenom} {form.nom} · {form.email}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md uppercase", COLOR_MAP[selectedProf.color], COLOR_ICON[selectedProf.color])}>
                          {selectedProf.label}
                        </span>
                        {secondary.map(r => (
                          <span key={r} className="text-[10px] font-black bg-accent/20 text-accent px-2 py-0.5 rounded-md uppercase">{r}</span>
                        ))}
                        {communes.find(c => c.id === Number(form.commune)) && (
                          <span className="text-[10px] font-black bg-white/10 text-white/60 px-2 py-0.5 rounded-md">
                            📍 {communes.find(c => c.id === Number(form.commune))?.nom}
                          </span>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold text-center">{error}</div>}
                      <Button type="submit" disabled={isSubmitting} className="w-full h-13 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20">
                        {isSubmitting
                          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Création du profil blockchain...</>
                          : "Créer mon profil Sentinelle →"}
                      </Button>
                    </form>

                    <p className="text-center text-[10px] text-white/25">
                      En vous inscrivant, vos signalements seront publics et associés à votre identité blockchain.
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>

              <div className="mt-6 pt-4 border-t border-white/8 text-center">
                <p className="text-white/30 text-xs">
                  Déjà membre ?{" "}
                  <Link href="/login" className="text-white font-black hover:text-primary transition-colors">Se connecter</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
