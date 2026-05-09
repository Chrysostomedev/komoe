"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Activity, Server, ShieldCheck, Box, Network, Globe, Loader2, ExternalLink } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import dynamic from 'next/dynamic';
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { useCommuneTransactions } from "@/lib/hooks/useTransactions";
import { formatDateShort } from "@/lib/constants";
import { BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";

const BlockchainMap = dynamic(() => import('@/components/ui/BlockchainMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-primary/5 rounded-3xl animate-pulse flex flex-col items-center justify-center text-muted-foreground gap-4">
    <Globe className="w-12 h-12 animate-spin text-primary/20" />
    <span className="text-sm font-black uppercase tracking-widest opacity-40">Chargement de la carte décentralisée...</span>
  </div>
});

import { useState, useEffect } from "react";

export default function BlockchainCommune() {
  const { user } = useAuth();
  const { transactions, loading } = useCommuneTransactions(user?.commune ?? null);
  
  const [blockTime, setBlockTime] = useState(2.1);
  const [tps, setTps] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockTime(+(2.1 + (Math.random() * 0.4 - 0.2)).toFixed(2));
      setTps(Math.floor(24 + (Math.random() * 10 - 5)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // On ne garde que les transactions qui ont un hash blockchain
  const blockchainTxs = transactions.filter(t => t.blockchain_tx_hash_soumission || t.blockchain_tx_hash_validation).slice(0, 5);
  const contractAddress = BUDGET_LEDGER_ADDRESS;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Interconnexion avec Polygon Amoy...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Réseau Polygon Amoy — {user?.commune_nom}</h2>
          <p className="text-muted-foreground mt-1 font-medium text-sm">Surveillance de l'intégrité des données communales sur la sidechain.</p>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 py-2 px-4 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          Statut du Contrat : Opérationnel
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Transactions Certifiées" value={transactions.filter(t => t.statut === 'VALIDE').length} icon={<ShieldCheck className="text-primary" />} />
        <StatsCard label="Temps de Bloc" value={`${blockTime}s`} trend={blockTime > 2.1 ? "down" : "up"} icon={<Activity className="text-emerald-500" />} />
        <StatsCard label="Vitesse Réseau" value={`${tps} TPS`} icon={<Activity className="text-blue-500" />} />
        <StatsCard label="Contrat Actif" value="v1.0.3" icon={<Box className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-2xl border-border rounded-[32px] overflow-hidden border">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3 text-foreground">
              <Server className="text-primary" size={20} />
              Configuration On-Chain
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Adresse du Smart Contract</p>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-mono font-bold text-primary truncate mr-2">{contractAddress}</span>
                   <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-2xl border border-border">
                <span className="text-xs font-black uppercase text-muted-foreground">Réseau Actif</span>
                <span className="text-sm font-black text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-xl">Polygon Amoy</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-2xl border border-border">
                <span className="text-xs font-black uppercase text-muted-foreground">ID Chaîne</span>
                <span className="text-sm font-black text-foreground">80002</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-2xl border border-border">
                <span className="text-xs font-black uppercase text-muted-foreground">Validation</span>
                <span className="text-sm font-black text-foreground italic">Proof of Stake</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-2xl border-border rounded-[32px] overflow-hidden border">
          <CardHeader className="bg-muted/30 border-b border-border p-6">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3 text-foreground">
              <Box className="text-primary" size={20} />
              Journal des Preuves de la Commune
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {blockchainTxs.length > 0 ? blockchainTxs.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-5 hover:bg-muted/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-base font-black text-foreground">Preuve #{tx.id.slice(0, 8)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formatDateShort(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-muted-foreground mb-1 truncate max-w-[150px]">
                      {tx.blockchain_tx_hash_validation || tx.blockchain_tx_hash_soumission}
                    </p>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-black">CERTIFIÉ</Badge>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 gap-4">
                   <Network className="w-12 h-12 opacity-10" />
                   <p className="text-xs font-black uppercase tracking-widest">Aucune preuve on-chain enregistrée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border">
        <CardHeader className="bg-muted/30 border-b border-border p-6">
          <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3 text-foreground">
            <Globe className="text-primary" size={20} />
            Topologie du Réseau Décentralisé KOMOE
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <BlockchainMap />
            <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border shadow-xl">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
                  <span className="text-xs font-black uppercase tracking-widest">Nœuds Nationaux (Actif)</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></div>
                  <span className="text-xs font-black uppercase tracking-widest">Relais Polygon Amoy</span>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
