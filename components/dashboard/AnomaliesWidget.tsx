"use client";

import { useEffect, useState } from "react";
import { anomaliesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertTriangle, ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";

export function AnomaliesWidget() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await anomaliesApi.list();
      setAnomalies(data.anomalies || []);
    } catch (err: any) {
      // Si l'endpoint n'est pas encore prêt ou retourne 404, on ignore silencieusement
      // pour ne pas polluer la console Next.js avec des erreurs vides {}
      if (err?.status !== 404) {
        console.warn("Anomalies non disponibles pour le moment.");
      }
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  return (
    <Card className="border-rose-500/20 shadow-lg shadow-rose-500/5 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-rose-500/10 flex flex-row items-center justify-between bg-rose-500/5">
        <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-4 h-4" />
          Détection Anomalies (IA)
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchAnomalies}
          className="w-6 h-6 hover:bg-rose-500/10 text-rose-500"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>
        ) : anomalies.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-10" />
            <p className="text-[10px] font-bold uppercase">Aucune anomalie détectée</p>
          </div>
        ) : (
          <div className="divide-y divide-rose-500/10">
            {anomalies.map((ano, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 flex gap-3 hover:bg-rose-500/5 transition-colors"
              >
                <div className="shrink-0 mt-1">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px] font-black uppercase">
                      {ano.type}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">{ano.commune}</span>
                  </div>
                  <p className="text-[11px] text-foreground font-medium leading-snug">{ano.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
