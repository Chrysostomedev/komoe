"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Globe, Sparkles, Loader2, UserPlus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api";

type Profession = "CITOYEN" | "JOURNALISTE" | "ONG" | "BAILLEUR" | "CHERCHEUR";
interface PublicCommune { id: number; nom: string; region: string; }

const PROFESSIONS = [
  { value: "CITOYEN",     label: "Citoyen" },
  { value: "JOURNALISTE", label: "Journaliste / Presse" },
  { value: "ONG",         label: "ONG / Société civile" },
  { value: "BAILLEUR",    label: "Bailleur de fonds" },
  { value: "CHERCHEUR",   label: "Analyste / Chercheur" },
];

const INPUT  = "w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all";
const SELECT = "w-full bg-[#0d0d2b] border border-white/25 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer";
const LABEL  = "block text-[10px] font-black uppercase text-white/50 tracking-widest mb-1.5 ml-1";

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

  const [profession, setProfession] = useState<Profession | "">("");
  const [form, setForm] = useState({ 
    email: "", 
    nom: "", 
    prenom: "", 
    telephone: "", 
    commune: "", 
    date_naissance: "", 
    media_organisation: "", 
    password: "", 
    password_confirm: "" 
  });
  
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upd = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const needsMedia = profession === "JOURNALISTE" || profession === "ONG";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); 
    setFieldErrors({});

    if (!profession) {
      setError("Veuillez sélectionner un profil.");
      return;
    }

    if (form.password !== form.password_confirm) { 
      setFieldErrors({ password_confirm: "Les mots de passe ne correspondent pas." }); 
      return; 
    }

    setIsSubmitting(true);
    try {
      await register({
        email: form.email, 
        nom: form.nom, 
        prenom: form.prenom,
        role: "CITOYEN", 
        profession: profession as Profession,
        password: form.password, 
        password_confirm: form.password_confirm,
        telephone: form.telephone || undefined,
        commune: form.commune ? Number(form.commune) : undefined,
        date_naissance: form.date_naissance || undefined,
        media_organisation: needsMedia ? form.media_organisation : undefined,
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
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const FE = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-[10px] font-bold text-red-400 mt-1 ml-1">{fieldErrors[field]}</p> : null;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 bg-[#070718] text-white overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">

        {/* ── LEFT COLUMN ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-5 flex flex-col justify-center py-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <img src="/img/logo_elephant.jpeg" alt="KOMOE" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-4xl font-black tracking-widest">KOMOE</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6 tracking-tight">
            Rejoignez la <span className="text-primary italic">Sentinelle</span>.
          </h1>
          <p className="text-white/50 font-medium leading-relaxed mb-10 text-base max-w-md">
            Créez votre compte en quelques secondes et commencez à auditer la transparence de votre commune sur la blockchain.
          </p>

          <div className="space-y-6">
            {[
              { icon: ShieldCheck, t: "Identité Blockchain", d: "Vos actions sont certifiées et immuables." },
              { icon: Globe, t: "Impact National", d: "Contribuez à la transparence des 201 communes." },
              { icon: Sparkles, t: "Réputation & Points", d: "Gagnez en influence au sein de la communauté." },
            ].map((x, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <x.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-black text-base text-white">{x.t}</p>
                  <p className="text-sm text-white/40">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT FORM ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-7">
          <Card className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]">
            <CardContent className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Inscription</h2>
                  <p className="text-white/40 text-xs mb-8">Remplissez les champs ci-dessous pour créer votre profil citoyen.</p>
                </div>

                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold text-center">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Adresse email *</label>
                    <input type="email" value={form.email} onChange={upd("email")} required placeholder="vous@exemple.ci" className={INPUT} />
                    <FE field="email" />
                  </div>
                  <div>
                    <label className={LABEL}>Type de Profil *</label>
                    <select 
                      value={profession} 
                      onChange={(e) => setProfession(e.target.value as Profession)} 
                      required 
                      className={SELECT}
                    >
                      <option value="" disabled className="text-white/40 bg-[#0d0d2b]">Sélectionnez votre profil</option>
                      {PROFESSIONS.map(p => (
                        <option key={p.value} value={p.value} className="bg-[#0d0d2b] text-white">{p.label}</option>
                      ))}
                    </select>
                    <FE field="profession" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Téléphone</label>
                    <input type="tel" value={form.telephone} onChange={upd("telephone")} placeholder="+225 07..." className={INPUT} />
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
                      <span className="text-sm text-white/50">Chargement...</span>
                    </div>
                  ) : (
                    <select value={form.commune} onChange={upd("commune")} required className={SELECT}>
                      <option value="" disabled className="text-white/40 bg-[#0d0d2b]">Où vivez-vous ?</option>
                      {communes.sort((a, b) => a.nom.localeCompare(b.nom)).map(c => (
                        <option key={c.id} value={c.id} className="bg-[#0d0d2b] text-white">{c.nom} ({c.region})</option>
                      ))}
                    </select>
                  )}
                  <FE field="commune" />
                </div>

                {needsMedia && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <label className={LABEL}>Média / Organisation *</label>
                    <input type="text" value={form.media_organisation} onChange={upd("media_organisation")}
                      placeholder="Nom de votre média ou ONG"
                      className={INPUT} />
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Mot de passe *</label>
                    <div className="relative">
                      <input type={showPwd ? "text" : "password"} value={form.password} onChange={upd("password")} required placeholder="••••••••" className={INPUT + " pr-11"} />
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
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-black uppercase tracking-widest text-base shadow-2xl shadow-primary/20 mt-4 group"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />Création en cours...</>
                  ) : (
                    <span className="flex items-center gap-2">
                      S'inscrire <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

                <div className="pt-6 border-t border-white/8 text-center">
                  <p className="text-white/40 text-sm font-medium">
                    Déjà inscrit ?{" "}
                    <Link href="/login" className="text-primary font-black hover:underline transition-colors">Se connecter</Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
