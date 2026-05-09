"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatFCFA, polygonscanTxUrl } from "@/lib/constants";
import { Building2, Activity, ExternalLink, ShieldCheck, Target } from "lucide-react";
import { motion } from "framer-motion";

interface ProjetCardProps {
  projet: {
    id: string | number;
    nom: string;
    description: string;
    budget_alloue_fcfa: number;
    taux_execution: number;
    statut: string;
    commune_nom?: string;
    blockchain_audit_hash?: string;
  };
}

const STATUT_STYLES: Record<string, string> = {
  EN_COURS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ACHEVE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  SOUS_ENQUETE: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  EN_ATTENTE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export function ProjetCard({ projet }: ProjetCardProps) {
  return (
    <Card className="group hover:border-primary/50 transition-all duration-500 bg-card/50 backdrop-blur-sm overflow-hidden border-border/50">
      <CardHeader className="pb-2 space-y-3">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className={STATUT_STYLES[projet.statut] || ""}>
            {projet.statut.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-tight">{projet.commune_nom || "Commune"}</span>
          </div>
        </div>
        <CardTitle className="text-base font-black leading-tight group-hover:text-primary transition-colors">
          {projet.nom}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {projet.description}
        </p>

        {/* Jauge d'exécution */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-muted-foreground">Progression</span>
            <span className="text-primary">{projet.taux_execution}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${projet.taux_execution}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Budget alloué</span>
            <p className="text-xs font-bold text-foreground">{formatFCFA(projet.budget_alloue_fcfa)}</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ID Blockchain</span>
            <div className="flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-mono text-muted-foreground">Audit Ready</span>
            </div>
          </div>
        </div>

        {projet.blockchain_audit_hash && (
          <a 
            href={polygonscanTxUrl(projet.blockchain_audit_hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-[9px] font-black uppercase tracking-widest text-primary"
          >
            Vérifier sur Polygonscan <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
