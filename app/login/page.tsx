"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Landmark, Briefcase, ShieldCheck, 
  Globe, Users, Eye, EyeOff, LogIn, Loader2 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getRoleDashboard } from "@/lib/auth-context";
import type { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ─── Comptes démo (login réel avec JWT) ───────────────────────────────────────
const DEMO_GROUPS = [
  {
    label: "La Mairie",
    color: "text-emerald-400",
    accounts: [
      {
        key: "AGENT_FINANCIER",
        email: "agent.abobo@komoe.ci",
        label: "Agent Financier",
        dest: "/commune/dashboard",
        icon: Building2,
        bgColor: "bg-emerald-500/10", textColor: "text-emerald-400", borderHover: "hover:border-emerald-500/50",
        desc: "Saisit les dépenses. Soumet au Maire.",
      },
      {
        key: "MAIRE",
        email: "maire.abobo@komoe.ci",
        label: "Maire",
        dest: "/commune/dashboard",
        icon: ShieldCheck,
        bgColor: "bg-emerald-500/10", textColor: "text-emerald-400", borderHover: "hover:border-emerald-500/50",
        desc: "Valide les transactions sur Polygon.",
      },
    ],
  },
  {
    label: "Contrôle & Audit",
    color: "text-blue-400",
    accounts: [
      {
        key: "DGDDL",
        email: "dgddl@komoe.ci",
        label: "DGDDL",
        dest: "/controle/dashboard",
        icon: Globe,
        bgColor: "bg-blue-500/10", textColor: "text-blue-400", borderHover: "hover:border-blue-500/50",
        desc: "Supervise les 201 communes.",
      },
      {
        key: "COUR_COMPTES",
        email: "cour.comptes@komoe.ci",
        label: "Cour des Comptes",
        dest: "/controle/dashboard",
        icon: ShieldCheck,
        bgColor: "bg-red-500/10", textColor: "text-red-400", borderHover: "hover:border-red-500/50",
        desc: "Auditeur indépendant. Vue totale.",
      },
    ],
  },
  {
    label: "Public & Bailleurs",
    color: "text-purple-400",
    accounts: [
      {
        key: "BAILLEUR",
        email: "bailleur@komoe.ci",
        label: "Bailleur",
        dest: "/public/dashboard",
        icon: Briefcase,
        bgColor: "bg-purple-500/10", textColor: "text-purple-400", borderHover: "hover:border-purple-500/50",
        desc: "Suit les projets financés.",
      },
      {
        key: "CITOYEN",
        email: "citoyen@komoe.ci",
        label: "Citoyen",
        dest: "/public/dashboard",
        icon: Users,
        bgColor: "bg-orange-500/10", textColor: "text-orange-400", borderHover: "hover:border-orange-500/50",
        desc: "Consulte le budget public.",
      },
      {
        key: "JOURNALISTE",
        email: "journaliste@komoe.ci",
        label: "Presse / ONG",
        dest: "/public/dashboard",
        icon: Landmark,
        bgColor: "bg-muted0/10", textColor: "text-slate-300", borderHover: "hover:border-slate-500/50",
        desc: "Accès public avec export CSV.",
      },
    ],
  },
];

// ─── Animations Framer Motion ─────────────────────────────────────────────────
const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

// ─── Formulaire Login ─────────────────────────────────────────────────────────
function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [mode, setMode] = useState<"auth" | "demo">("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      const { authApi } = await import("@/lib/api");
      const profile = await authApi.me();
      const dest = redirect || getRoleDashboard(profile.role);
      router.push(dest);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Email ou mot de passe incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginAs = async (accEmail: string, dest: string, key: string) => {
    setLoadingKey(key);
    setError(null);
    try {
      await login({ email: accEmail, password: "Komoe@2024!" });
      router.push(dest);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? `Échec connexion démo (${accEmail}). Avez-vous lancé : python manage.py migrate && python manage.py seed_data ?`);
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-background overflow-hidden text-foreground">
      {/* Orbes décoratifs de fond */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-screen" />

      {/* En-tête */}
      <motion.div 
        initial="hidden" animate="visible" variants={fadeUpVariants}
        className="text-center mb-8 relative z-10"
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-black text-xl">K</span>
          </div>
          <span className="text-5xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">KOMOE</span>
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 uppercase tracking-wider">Polygon Amoy</span>
        </div>
        <p className="text-muted-foreground text-lg font-medium">L'infrastructure de transparence budgétaire</p>
      </motion.div>


      {/* Toggle Auth / Démo (Segmented Control) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="relative z-10 flex p-1 mb-8 bg-muted/50 backdrop-blur-md rounded-xl border border-border"
      >
        {(["auth", "demo"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors z-20",
              mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === m && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-background border border-border rounded-lg -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            {m === "auth" ? "Connexion" : "Mode Démo"}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === "auth" ? (
          <motion.div
            key="auth"
            initial="hidden" animate="visible" exit="exit" variants={fadeUpVariants}
            className="w-full max-w-md relative z-10"
          >
            <div className="bg-card backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Bienvenue</h2>

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center font-medium">
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="vous@komoe.ci"
                    className="w-full px-4 py-3 bg-muted/60 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-muted/60 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>


                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full py-6 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 mt-2"
                >
                  {!isSubmitting && <LogIn className="w-4 h-4 mr-2" />}
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground font-medium text-center">
                Pas encore membre de la communauté ? <br/>
                <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Accès Citoyen Libre</span>
              </p>
              <Link 
                href="/register" 
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              >
                <Users className="w-4 h-4" />
                Créer mon compte citoyen
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="demo"
            initial="hidden" animate="visible" exit="exit" variants={fadeUpVariants}
            className="max-w-5xl w-full relative z-10"
          >
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground">Connexion automatique (Mot de passe : <span className="font-mono text-foreground/80">Komoe@2024!</span>)</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center font-medium">
                {error}
              </motion.div>
            )}

            <div className="space-y-8">
              {DEMO_GROUPS.map((group, idx) => (
                <motion.div 
                  key={group.label}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                >
                  <p className={cn("text-xs font-bold uppercase tracking-widest mb-4 ml-1", group.color)}>{group.label}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.accounts.map((acc) => {
                      const Icon = acc.icon;
                      const isLoading = loadingKey === acc.key;
                      return (
                        <button
                          key={acc.key}
                          onClick={() => loginAs(acc.email, acc.dest, acc.key)}
                          disabled={!!loadingKey}
                          className={cn(
                            "group text-left bg-card/40 backdrop-blur-md border border-border rounded-2xl p-5",
                            "flex flex-col gap-4 transition-all duration-300",
                            "hover:bg-card hover:shadow-xl hover:-translate-y-1",
                            acc.borderHover,
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3">
                             <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", acc.bgColor, acc.textColor)}>
                               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-6 h-6" />}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-foreground">{acc.label}</p>
                               <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{acc.email}</p>
                             </div>
                           </div>
                           <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                             {acc.desc}
                           </p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
