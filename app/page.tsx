"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, BarChart3, Users, ArrowRight, CheckCircle2, Globe, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-primary-foreground w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-primary">KOMOE</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Fonctionnalités</Link>
            <Link href="#blockchain" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Blockchain</Link>
            <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Se connecter</Link>
            <Button asChild className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20">
              <Link href="/register">Essayer Gratuitement</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
              <Zap size={14} className="fill-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">Le futur de la finance publique</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-foreground mb-8">
              Rendre la <span className="text-primary italic">transparence</span> immuable.
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-xl leading-relaxed mb-10">
              KOMOE utilise la blockchain Polygon pour auditer en temps réel les finances des collectivités locales. Donnez du pouvoir aux citoyens et de la confiance aux investisseurs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-2xl shadow-primary/30 group">
                <Link href="/register" className="flex items-center gap-3">
                  Rejoindre l&apos;aventure
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-2 border-border hover:border-primary hover:text-primary font-black text-lg">
                <Link href="/login">Démonstration Live</Link>
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-background bg-muted" />
                ))}
              </div>
              <p className="text-sm font-bold text-muted-foreground">
                <span className="text-foreground">12+ Communes</span> utilisent déjà KOMOE
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-card rounded-[40px] shadow-2xl p-4 border border-border">
               {/* Mockup Dashboard UI */}
               <div className="bg-muted/50 rounded-[32px] p-8 aspect-square lg:aspect-[4/3] flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div className="w-24 h-8 bg-muted rounded-lg animate-pulse" />
                    <div className="w-8 h-8 bg-primary rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-primary/10 rounded-3xl border border-primary/20 flex flex-col justify-center px-6">
                       <p className="text-[10px] font-black text-primary uppercase">Budget 2026</p>
                       <p className="text-2xl font-black text-primary">1.2B FCFA</p>
                    </div>
                    <div className="h-32 bg-card rounded-3xl shadow-sm border border-border flex flex-col justify-center px-6">
                       <p className="text-[10px] font-black text-muted-foreground uppercase">Score Transparence</p>
                       <p className="text-2xl font-black text-emerald-500">98/100</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-card rounded-3xl shadow-sm border border-border p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Dernières transactions Blockchain</span>
                     </div>
                     <div className="space-y-4">
                        {[1,2,3].map(i => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                             <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                             <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ─── Stats / Partners ─── */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <p className="text-4xl font-black mb-2 tabular-nums">100%</p>
              <p className="text-xs font-bold text-primary-foreground/60 uppercase tracking-widest">Incorruptible</p>
            </div>
            <div>
              <p className="text-4xl font-black mb-2 tabular-nums">2.4k</p>
              <p className="text-xs font-bold text-primary-foreground/60 uppercase tracking-widest">Preuves IPFS</p>
            </div>
            <div>
              <p className="text-4xl font-black mb-2 tabular-nums">0.0s</p>
              <p className="text-xs font-bold text-primary-foreground/60 uppercase tracking-widest">Temps réel</p>
            </div>
            <div>
              <p className="text-4xl font-black mb-2 tabular-nums">0.01$</p>
              <p className="text-xs font-bold text-primary-foreground/60 uppercase tracking-widest">Coût transaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-6">Un écosystème de confiance.</h2>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Trois acteurs, une seule vérité. KOMOE harmonise les relations entre l&apos;État, les bailleurs et le peuple.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Agents Financiers",
              desc: "Digitalisez la saisie des dépenses avec horodatage blockchain et stockage décentralisé des justificatifs.",
              icon: Zap,
              color: "bg-blue-500"
            },
            {
              title: "Maires & Décideurs",
              desc: "Validez les flux financiers via des signatures multisig et assurez l'intégrité de votre budget annuel.",
              icon: Lock,
              color: "bg-primary"
            },
            {
              title: "Citoyens & Bailleurs",
              desc: "Accédez en temps réel aux données d'exécution budgétaire et auditez les comptes sans intermédiaire.",
              icon: Users,
              color: "bg-emerald-500"
            }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              whileHover={{ y: -10 }}
              className="p-10 rounded-[40px] bg-card border border-border hover:shadow-2xl transition-all"
            >
              <div className={`w-16 h-16 ${feat.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg`}>
                <feat.icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">{feat.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
           <div className="bg-primary rounded-[60px] p-12 md:p-24 text-center text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/40">
              <div className="relative z-10">
                <h2 className="text-4xl md:text-7xl font-black tracking-tight mb-8">Prêt à transformer <br />votre collectivité ?</h2>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-background text-primary hover:bg-muted font-black text-xl shadow-xl">
                    <Link href="/register">Commencer Maintenant</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-16 px-12 rounded-2xl border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-black text-xl">
                    <Link href="/login">Contactez-nous</Link>
                  </Button>
                </div>
              </div>
              {/* Background Glow */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
           </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary w-8 h-8" />
            <span className="text-xl font-black tracking-tighter text-primary uppercase">KOMOE</span>
          </div>
          <div className="flex gap-12 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="#" className="hover:text-primary">Legal</Link>
            <Link href="#" className="hover:text-primary">Blockchain</Link>
            <Link href="#" className="hover:text-primary">Github</Link>
          </div>
          <p className="text-sm font-bold text-muted-foreground/60">© 2026 KOMOE Platform. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
