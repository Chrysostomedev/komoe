"use client";

import { useState, useEffect } from "react";
import { useWatchContractEvent } from "wagmi";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShieldCheck, Activity, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatFCFA, truncateHash, polygonscanTxUrl } from "@/lib/constants";

export default function AuditContratPage() {
  const [events, setEvents] = useState<any[]>([]);

  // Watch for validation events
  useWatchContractEvent({
    address: BUDGET_LEDGER_ADDRESS,
    abi: BUDGET_LEDGER_ABI,
    eventName: "DepenseValidee",
    onLogs(logs) {
      const newEvents = logs.map(log => ({
        type: "VALIDE",
        txHash: log.transactionHash,
        data: (log as any).args,
        timestamp: new Date().toLocaleTimeString()
      }));
      setEvents(prev => [...newEvents, ...prev].slice(0, 50));
    },
  });

  useWatchContractEvent({
    address: BUDGET_LEDGER_ADDRESS,
    abi: BUDGET_LEDGER_ABI,
    eventName: "RecetteEnregistree",
    onLogs(logs) {
      const newEvents = logs.map(log => ({
        type: "RECETTE",
        txHash: log.transactionHash,
        data: (log as any).args,
        timestamp: new Date().toLocaleTimeString()
      }));
      setEvents(prev => [...newEvents, ...prev].slice(0, 50));
    },
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="mb-12 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <ShieldCheck className="w-3 h-3" />
            Live Audit Engine
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            Ancrage <span className="text-emerald-500 italic">Temps Réel.</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto font-medium">
            Flux direct des événements émis par le Smart Contract <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{truncateHash(BUDGET_LEDGER_ADDRESS)}</code> sur Polygon.
          </p>
        </div>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {events.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border/50 rounded-3xl">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20 animate-pulse" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  En attente de nouveaux événements blockchain...
                </p>
              </div>
            ) : (
              events.map((ev, i) => (
                <motion.div
                  key={ev.txHash + i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border/50 p-6 rounded-3xl shadow-xl shadow-black/5 flex items-start gap-6 hover:border-emerald-500/30 transition-colors"
                >
                  <div className={`p-4 rounded-2xl ${ev.type === 'VALIDE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                    {ev.type === 'VALIDE' ? <ShieldCheck className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-tight">
                          {ev.type === 'VALIDE' ? "Dépense Certifiée" : "Recette Enregistrée"}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> {ev.timestamp} • Bloc Polygon Confirmé
                        </p>
                      </div>
                      <a 
                        href={polygonscanTxUrl(ev.txHash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-[10px] font-black uppercase flex items-center gap-1"
                      >
                        Scanner <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 py-4 border-y border-border/50">
                      <div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Montant</span>
                        <p className="text-lg font-black text-foreground italic">{formatFCFA(Number(ev.data.montant))}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Commune</span>
                        <p className="text-sm font-bold text-foreground">ID: {ev.data.communeId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        ID: {truncateHash(ev.data.depenseId || ev.data.recetteId)}
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <div className="text-[10px] font-bold text-primary italic">
                        {ev.data.categorie || ev.data.source}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
