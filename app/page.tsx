"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, BarChart3, Users, ArrowRight, CheckCircle2, Globe, Lock, Zap, Network } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/img/logo_elephant.jpeg" alt="KOMOE" className="w-10 h-10 object-contain" />
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
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
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
                {[1,2,3,4,5].map(i => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?u=${i + 20}`} 
                    alt="Utilisateur Komoe" 
                    className="w-14 h-14 rounded-full border-4 border-background object-cover shadow-xl" 
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/50">
                <span className="text-foreground font-black">201 Communes</span> de Côte d'Ivoire nous font confiance
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

      {/* ─── Blockchain Section ─── */}
      <section id="blockchain" className="py-40 bg-foreground text-background relative overflow-hidden">
        {/* Abstract background for tech feel */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(var(--primary),0.2),transparent_70%)]" />
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent top-1/4" />
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent top-2/4" />
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent top-3/4" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 text-primary rounded-full mb-10">
                <Network size={20} className="animate-spin [animation-duration:5s]" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Technologie de pointe</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-none">
                Gravé dans le <br /><span className="text-primary">code</span>, pas sur <br />le papier.
              </h2>
              <div className="space-y-8">
                <div className="flex gap-6 p-8 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-2">Polygon PoS Network</h4>
                    <p className="text-background/60 font-medium leading-relaxed">
                      Nous utilisons le réseau Polygon pour sa rapidité et son coût dérisoire, permettant de certifier chaque transaction communale sans peser sur le budget.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 p-8 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Globe size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-2">Stockage IPFS (Pinata)</h4>
                    <p className="text-background/60 font-medium leading-relaxed">
                      Vos justificatifs sont stockés de manière décentralisée. Même si notre serveur s'arrête, vos preuves restent accessibles à vie sur le Web3.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-8 mt-12">
                   <div className="p-10 rounded-[40px] bg-card text-foreground border border-border shadow-2xl flex flex-col items-center text-center">
                      <p className="text-4xl font-black mb-2">100%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Incorruptible</p>
                   </div>
                   <div className="p-10 rounded-[40px] bg-primary text-primary-foreground shadow-2xl flex flex-col items-center text-center">
                      <p className="text-4xl font-black mb-2">0.0s</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60">Temps Réel</p>
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="p-10 rounded-[40px] bg-card text-foreground border border-border shadow-2xl flex flex-col items-center text-center">
                      <p className="text-4xl font-black mb-2">2.4k</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preuves IPFS</p>
                   </div>
                   <div className="p-10 rounded-[40px] bg-card text-foreground border border-border shadow-2xl flex flex-col items-center text-center">
                      <p className="text-4xl font-black mb-2">0.01$</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coût / TX</p>
                   </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 blur-[120px] rounded-full" />
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
              desc: "Digitalisez la saisie des dépenses avec horodatage blockchain et stockage décentralisé. Une interface intuitive conçue pour la rapidité et la fiabilité sur le terrain.",
              icon: Zap,
              color: "from-blue-500 to-cyan-500",
              features: ["Saisie intuitive", "Scan justificatif intelligent", "Preuve IPFS immédiate", "Mode hors-ligne"]
            },
            {
              title: "Maires & Décideurs",
              desc: "Validez les flux financiers via des signatures cryptographiques. Prenez des décisions basées sur des données réelles et assurez l'intégrité de votre budget.",
              icon: Lock,
              color: "from-orange-500 to-amber-500",
              features: ["Signature Multisig", "Suivi budgétaire Live", "Tableaux de bord analytiques", "Audit automatique"]
            },
            {
              title: "Citoyens & Bailleurs",
              desc: "Accédez à une transparence sans précédent. Auditez les dépenses communales sans intermédiaire et participez à la gouvernance locale.",
              icon: Users,
              color: "from-emerald-500 to-teal-500",
              features: ["Vérification publique", "Scores de transparence", "Alertes anomalies", "Export de données"]
            }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              whileHover={{ y: -12, scale: 1.03 }}
              className="p-10 rounded-[48px] bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all group overflow-hidden relative"
            >
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${feat.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
              
              <div className={`w-20 h-20 bg-gradient-to-br ${feat.color} text-white rounded-[28px] flex items-center justify-center mb-10 shadow-2xl group-hover:rotate-6 transition-transform relative z-10`}>
                <feat.icon size={40} />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">{feat.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed mb-10 text-lg">{feat.desc}</p>
              
              <ul className="space-y-4 relative z-10">
                {feat.features.map(f => (
                  <li key={f} className="flex items-center gap-4 text-sm font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
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
      <footer className="pt-32 pb-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src="/img/logo_elephant.jpeg" alt="KOMOE" className="w-full h-full object-contain" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-primary">KOMOE</span>
              </div>
              <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
                La première plateforme de gouvernance budgétaire transparente en Afrique de l'Ouest, propulsée par la blockchain.
              </p>
              <div className="flex gap-4">
                {['twitter', 'github', 'linkedin'].map(social => (
                  <div key={social} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer">
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-current rounded-sm opacity-20" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-black text-foreground uppercase tracking-widest text-xs mb-8">Plateforme</h4>
              <ul className="space-y-4">
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors font-medium">Fonctionnalités</Link></li>
                <li><Link href="#blockchain" className="text-muted-foreground hover:text-primary transition-colors font-medium">Technologie Polygon</Link></li>
                <li><Link href="/public/communes" className="text-muted-foreground hover:text-primary transition-colors font-medium">Carte des Communes</Link></li>
                <li><Link href="/public/scores" className="text-muted-foreground hover:text-primary transition-colors font-medium">Scores Transparence</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-foreground uppercase tracking-widest text-xs mb-8">Ressources</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Documentation API</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Guide Citoyen</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Rapports Annuels</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Blog & Actualités</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-foreground uppercase tracking-widest text-xs mb-8">Contact</h4>
              <ul className="space-y-4">
                <li className="text-muted-foreground font-medium">Abidjan, Côte d'Ivoire</li>
                <li className="text-muted-foreground font-medium">contact@komoe.ci</li>
                <li className="text-primary font-black">+225 07 00 00 00 00</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-bold text-muted-foreground/60">
              © 2026 KOMOE Platform. Développé pour le Hackathon MIABE.
            </p>
            <div className="flex gap-8 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
              <Link href="#" className="hover:text-primary">Confidentialité</Link>
              <Link href="#" className="hover:text-primary">Conditions</Link>
              <Link href="#" className="hover:text-primary">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
