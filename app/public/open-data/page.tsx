"use client";

import { useEffect, useState } from "react";
import { openDataApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Globe, Database, BarChart3, Activity, ShieldCheck, Download, Code, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import StatsCard from "@/components/ui/StatsCard";
import { formatFCFA, formatDateShort } from "@/lib/constants";
import { motion } from "framer-motion";

export default function OpenDataPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    openDataApi.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="mb-12 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <Globe className="w-3 h-3" />
            Infrastructure Open Data
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            Transparence <span className="text-primary italic">Totale.</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto font-medium">
            Accédez aux données financières certifiées par la blockchain Polygon pour toutes les communes de Côte d'Ivoire.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCard
            label="Total Dépenses Certifiées"
            value={stats ? formatFCFA(stats.total_depenses_xof) : "---"}
            icon={<Activity className="w-4 h-4" />}
            delta="+12%"
          />
          <StatsCard
            label="Transactions On-Chain"
            value={stats ? stats.nb_transactions_certifiees : "---"}
            icon={<Database className="w-4 h-4" />}
          />
          <StatsCard
            label="Engagement Citoyen"
            value={stats ? stats.nb_signalements_citoyens : "---"}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* API Section */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <Code className="w-4 h-4 text-primary" />
                API Publique (v1)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Chercheurs, journalistes et développeurs : interrogez nos données en temps réel via notre API REST documentée.
              </p>
              <div className="space-y-3">
                {[
                  { method: "GET", path: "/api/open/stats/", label: "Stats Nationales" },
                  { method: "GET", path: "/api/transactions/", label: "Flux de Dépenses" },
                  { method: "GET", path: "/api/communes/", label: "Répertoire Communes" },
                ].map((api, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-primary">{api.method}</span>
                      <code className="text-[10px] font-mono text-muted-foreground">{api.path}</code>
                    </div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{api.label}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest group">
                Consulter la Documentation
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <Download className="w-4 h-4 text-primary" />
                Exports de Données
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Téléchargez les jeux de données complets pour vos analyses locales (Excel, CSV, JSON).
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl hover:border-primary/50">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dataset CSV</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl hover:border-primary/50">
                  <Database className="w-6 h-6 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Archive JSON</span>
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] font-medium leading-relaxed">
                  Toutes les données exportées incluent les <span className="font-bold">Hashes Polygon</span> originaux pour garantir qu'aucune modification n'a été faite après l'export.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
            Dernière synchronisation blockchain : {stats ? formatDateShort(stats.last_update) : "---"}
          </p>
        </div>

      </div>
    </div>
  );
}
