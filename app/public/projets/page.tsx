"use client";

import { useEffect, useState } from "react";
import { projetsApi } from "@/lib/api";
import { ProjetCard } from "@/components/projets/ProjetCard";
import { Loader2, Search, Filter, Building2 } from "lucide-react";
import { Input } from "@/components/ui/ReusableForm";
import { motion } from "framer-motion";

export default function PublicProjetsPage() {
  const [projets, setProjets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    projetsApi.list().then(data => {
      const results = Array.isArray(data) ? data : (data as any)?.results || [];
      setProjets(results);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = projets.filter(p => 
    p.nom.toLowerCase().includes(search.toLowerCase()) || 
    p.commune_nom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                Suivi des <span className="text-primary italic">Projets.</span>
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                Vérifiez l'avancement réel des projets financés dans votre commune.
              </p>
            </div>
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un projet ou une commune..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-card border border-border/50 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Chargement des projets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Aucun projet trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((projet, idx) => (
              <motion.div
                key={projet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <ProjetCard projet={projet} />
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
