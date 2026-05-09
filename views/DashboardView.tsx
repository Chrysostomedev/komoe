"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

import { Role, ROLE_LABELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, Activity,
  Globe, Clock, CheckCircle,
  ShieldCheck, ExternalLink, Loader2, AlertTriangle, XCircle,
  Wallet, PieChart, BarChart3, Receipt, Building2, Eye, Users, FileText, Target,
  ShieldAlert, Lock, ChevronRight, Search
} from 'lucide-react';
import { cn, formatFCFA, formatDateShort, truncateHash, polygonscanTxUrl, stripHtml } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Link from "next/link";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/ReusableForm";
import StatsCard from '@/components/ui/StatsCard';
import { useRouter } from 'next/navigation';
import { useCommunesList } from '@/lib/hooks/useCommunes';
import { useCommuneTransactions, useTransactionsList, STATUT_LABELS, STATUT_VARIANT } from '@/lib/hooks/useTransactions';
import { useProjets } from '@/lib/hooks/useProjets';
import { type Commune, type Transaction, rapportsApi, projetsApi } from '@/lib/api';
import { AnomaliesWidget } from '@/components/dashboard/AnomaliesWidget';
import { ProjetCard } from '@/components/projets/ProjetCard';
import { ipfsService } from "@/lib/ipfs";
import { useWriteContract, useAccount } from "wagmi";
import { parseGwei } from "viem";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";

interface DashboardViewProps {
  role: Role;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const label = STATUT_LABELS[status] ?? status;
  const variant = STATUT_VARIANT[status] ?? 'outline';
  return <Badge variant={variant as any}>{label}</Badge>;
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
    <span className="text-sm font-medium tracking-widest uppercase">Synchronisation Polygon...</span>
  </div>
);

const ErrorState = ({ msg }: { msg: string }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-semibold border border-red-200 dark:border-red-900/30">
    <AlertTriangle className="w-5 h-5 shrink-0" />
    {msg}
  </motion.div>
);

// ─── Shared sub-components ───────────────────────────────────────────────────

const RecentTransactionsBlock = ({ txs, title, loading, error, viewAllHref }: {
  txs: Transaction[]; title: string; loading?: boolean; error?: string | null; viewAllHref?: string;
}) => {
  const router = useRouter();

  return (
  <Card className="h-full flex flex-col">
    <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <Activity className="w-4 h-4 text-accent" />
        {title}
      </CardTitle>
      {viewAllHref && txs.length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => router.push(viewAllHref)} className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
          Voir tout
        </Button>
      )}
    </CardHeader>
    <CardContent className="flex-1 p-0 overflow-y-auto no-scrollbar">
      {loading && <div className="p-8"><LoadingState /></div>}
      {!loading && error && <div className="p-4"><ErrorState msg={error} /></div>}
      {!loading && !error && txs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
          <Receipt className="w-8 h-8 mb-3 opacity-20" />
          <p className="text-sm">Aucune transaction trouvée.</p>
        </div>
      )}
      {!loading && !error && txs.length > 0 && (
        <div className="divide-y divide-border">
          {txs.slice(0, 7).map((tx, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: idx * 0.05 }}
              key={`${tx.id}-${idx}`} 
              onClick={() => router.push(`/commune/transactions/${tx.id}`)}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${tx.type === 'DEPENSE' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  {tx.type === 'DEPENSE' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">{stripHtml(tx.description)}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 opacity-70">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{tx.categorie}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                    <span className="text-[10px] font-bold text-muted-foreground italic truncate max-w-[80px]">{tx.soumis_par_detail?.full_name || "Agent"}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                    <span className="text-[10px] font-bold text-muted-foreground">{tx.periode}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                    <span className="text-[10px] font-bold text-muted-foreground">{formatDateShort(tx.created_at)}</span>
                  </div>
                    {tx.blockchain_tx_hash_validation && (
                      <a
                        href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-mono font-bold text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                      >
                        {truncateHash(tx.blockchain_tx_hash_validation, 4)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              <div className="text-left sm:text-right mt-3 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                <div className="flex flex-col items-start gap-1">
                  <Badge 
                    className={`rounded-lg font-black text-[8px] px-1.5 py-0 ${
                      tx.type === 'RECETTE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-rose-500/10 text-rose-600 border-rose-200'
                    }`}
                  >
                    {tx.type}
                  </Badge>
                  <p className={`font-black tracking-tight tabular-nums ${tx.type === 'DEPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {tx.type === 'DEPENSE' ? '−' : '+'} {formatFCFA(tx.montant_fcfa)}
                  </p>
                  <StatusBadge status={tx.statut} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
  );
};

const ScoreBar = ({ score }: { score: number }) => (
  <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${score}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
    />
  </div>
);

// ─── AGENT FINANCIER ─────────────────────────────────────────────────────────
const AgentDashboard = ({ communeId }: { communeId: number }) => {
  const router = useRouter();
  const { transactions: all, loading, error } = useCommuneTransactions(communeId);
  const enAttente = all.filter(t => t.statut === 'SOUMIS' || t.statut === 'BROUILLON');
  const valides = all.filter(t => t.statut === 'VALIDE');
  const { communes } = useCommunesList();
  const commune = communes.find(c => c.id === communeId);
  const totalDepensesAgent = valides.reduce((sum: number, t: any) => sum + (t.type === 'DEPENSE' ? t.montant_fcfa : 0), 0);
  const totalRecettesAgent = valides.reduce((sum: number, t: any) => sum + (t.type === 'RECETTE' ? t.montant_fcfa : 0), 0);
  const budgetAnnuelAgent = commune?.budget_annuel_fcfa ?? 0;
  const budgetRestantAgent = budgetAnnuelAgent + totalRecettesAgent - totalDepensesAgent;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Premium Agent */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/50 backdrop-blur-xl border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Tableau de Bord Agent</h1>
          <p className="text-muted-foreground mt-1 font-medium italic">
            Commune de <span className="text-primary font-bold">{commune?.nom || "Abidjan"}</span> — Signature Blockchain active 🔐
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => router.push('/commune/transactions/nouvelle')} 
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-8 font-black text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            + Nouvelle Saisie
          </Button>
          <Button 
            onClick={() => router.push('/commune/budget')} 
            variant="outline" 
            className="rounded-2xl h-14 px-6 border-border font-bold hover:bg-muted/50"
          >
            Gérer Budget
          </Button>
          {commune && (
            <a href={rapportsApi.getDownloadUrl(commune.id)} target="_blank" rel="noopener noreferrer">
              <Button 
                variant="outline" 
                className="rounded-2xl h-14 px-6 border-primary text-primary font-black hover:bg-primary/5 flex items-center gap-2"
              >
                <FileText size={18} /> Audit PDF
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard label="Mes saisies ce mois" value={all.length} icon={<Receipt className="text-primary" />} />
        <StatsCard label="En attente de validation" value={enAttente.length} icon={<Clock className="text-amber-500" />} />
        <StatsCard label="Recettes collectées" value={totalRecettesAgent} isCurrency icon={<Receipt className="text-emerald-500" />} />
        <StatsCard label="Budget disponible" value={budgetRestantAgent} isCurrency icon={<Wallet className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentTransactionsBlock txs={valides} title="Dernières transactions validées" viewAllHref="/commune/transactions" />
        </div>
        <div className="lg:col-span-1">
          <Card className="h-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20 rounded-[32px] shadow-xl">
            <CardHeader className="pb-4 border-b border-amber-500/10">
              <CardTitle className="text-amber-600 flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Clock className="w-4 h-4" /> En attente de signature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {enAttente.slice(0, 6).map((tx, idx) => (
                <div 
                  key={`${tx.id}-${idx}`} 
                  onClick={() => router.push(`/commune/transactions/${tx.id}`)}
                  className="p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-amber-500/20 shadow-sm cursor-pointer hover:border-amber-500 transition-all hover:translate-x-1"
                >
                  <p className="font-bold text-foreground text-sm line-clamp-1">{stripHtml(tx.description)}</p>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter opacity-70">{formatDateShort(tx.created_at)}</p>
                    <p className="font-black text-amber-600 tabular-nums text-sm">{formatFCFA(tx.montant_fcfa)}</p>
                  </div>
                </div>
              ))}
              {enAttente.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-amber-600/30">
                   <CheckCircle className="w-12 h-12 mb-2 opacity-10" />
                   <p className="text-xs font-black uppercase tracking-widest">Tout est à jour</p>
                </div>
              )}
              {enAttente.length > 6 && (
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700" onClick={() => router.push('/commune/en-attente')}>
                  Voir tout ({enAttente.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── MAIRE ────────────────────────────────────────────────────────────────────
const MaireDashboard = ({ communeId }: { communeId: number }) => {
  const router = useRouter();
  const [signingId, setSigningId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const { transactions: all, loading, error, refetch } = useCommuneTransactions(communeId);
  const enAttente = all.filter(t => t.statut === 'SOUMIS');
  const valides = all.filter(t => t.statut === 'VALIDE');
  const { communes } = useCommunesList();
  const commune = communes.find(c => c.id === communeId);
  const totalDepenses = valides.reduce((sum: number, t: any) => sum + (t.type === 'DEPENSE' ? t.montant_fcfa : 0), 0);
  const totalRecettes = valides.reduce((sum: number, t: any) => sum + (t.type === 'RECETTE' ? t.montant_fcfa : 0), 0);
  const budgetAnnuel = commune?.budget_annuel_fcfa ?? 0;
  const budgetRestant = budgetAnnuel + totalRecettes - totalDepenses;
  const txRate = budgetAnnuel > 0 ? ((totalDepenses / budgetAnnuel) * 100).toFixed(1) : '0.0';

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const handleValider = async (tx: Transaction) => {
    if (!isConnected) {
      alert("Veuillez connecter votre portefeuille MetaMask en haut à droite.");
      return;
    }

    setSigningId(tx.id);
    try {
      // 1. Signature Blockchain via MetaMask
      console.log(`📝 Signature Blockchain demandée pour ${tx.type}:`, tx.id);
      
      let hash = "";
      const { transactionsApi } = await import('@/lib/api');

      if (tx.type === 'RECETTE') {
        hash = await writeContractAsync({
          address: BUDGET_LEDGER_ADDRESS as `0x${string}`,
          abi: BUDGET_LEDGER_ABI,
          functionName: 'enregistrerRecette',
          args: [tx.id, String(tx.commune), BigInt(tx.montant_fcfa), tx.categorie, tx.ipfs_hash || "no-hash"],
        });
        // 2. Mise à jour du Backend pour Recette
        await transactionsApi.confirmerRecette(tx.id, hash);
        alert("Félicitations Monsieur le Maire ! La recette est certifiée sur Polygon. 🚀");
      } else {
        hash = await writeContractAsync({
          address: BUDGET_LEDGER_ADDRESS as `0x${string}`,
          abi: BUDGET_LEDGER_ABI,
          functionName: 'validerDepense',
          args: [tx.id, String(tx.commune), BigInt(tx.montant_fcfa), tx.categorie, tx.ipfs_hash || "no-hash"],
        });
        // 2. Mise à jour du Backend pour Dépense
        await transactionsApi.valider(tx.id, hash);
        alert("Félicitations Monsieur le Maire ! La dépense est gravée sur Polygon. 🔐");
      }

      refetch();
    } catch (err: any) {
      console.error("❌ Erreur de validation:", err);
      alert("Échec de la signature : " + (err.shortMessage || "Erreur de transaction"));
    } finally {
      setSigningId(null);
    }
  };

  const handleRejeterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId || !rejectMotif.trim()) return;

    setRejectLoading(true);
    try {
      const { transactionsApi } = await import('@/lib/api');
      // On nettoie le motif s'il contient de l'HTML (provenant du RichTextEditor)
      const cleanMotif = stripHtml(rejectMotif.trim());
      await transactionsApi.rejeter(rejectingId, cleanMotif);
      setIsRejectModalOpen(false);
      setRejectingId(null);
      setRejectMotif("");
      refetch();
    } catch (err: any) {
      console.error("❌ Erreur de rejet:", err);
      alert("Échec du rejet : " + (err.message || "Erreur inconnue"));
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Premium Maire */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Bonjour, Monsieur le Maire</h1>
          <p className="text-muted-foreground mt-1 font-medium italic">
            Commune de <span className="text-primary font-bold">{commune?.nom || "Abidjan"}</span> — Autorité de validation Blockchain
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">

          <Button 
            onClick={() => router.push('/commune/validation')} 
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-8 font-black text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            File de Validation ({enAttente.length})
          </Button>
          <Button 
            onClick={() => router.push('/commune/signalements')} 
            variant="outline" 
            className="rounded-2xl h-14 px-6 border-border font-bold hover:bg-muted/50"
          >
            Signalements
          </Button>
          {commune && (
            <a href={rapportsApi.getDownloadUrl(commune.id)} target="_blank" rel="noopener noreferrer">
              <Button 
                variant="outline" 
                className="rounded-2xl h-14 px-6 border-primary text-primary font-black hover:bg-primary/5 flex items-center gap-2"
              >
                <FileText size={18} /> Rapport PDF
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Budget Disponible" value={budgetRestant} isCurrency icon={<Wallet className="text-blue-500" />} />
        <StatsCard label="Recettes Collectées" value={totalRecettes} isCurrency icon={<Receipt className="text-emerald-500" />} />
        <StatsCard label="Dépenses Cumulées" value={totalDepenses} isCurrency icon={<Activity className="text-rose-500" />} />
        <StatsCard label="Taux d'exécution" value={`${txRate}%`} icon={<PieChart className="text-amber-500" />} />
      </div>
      
      {enAttente.length > 0 && (
        <Card className="border-2 border-amber-500/30 bg-amber-500/5 rounded-[32px] shadow-xl overflow-hidden">
          <CardHeader className="bg-amber-500/10 border-b border-amber-500/10 p-6">
            <CardTitle className="flex items-center gap-3 text-amber-600 font-black uppercase tracking-widest text-sm">
              <CheckCircle className="w-5 h-5 animate-pulse" />
              Actions requises : {enAttente.length} transaction(s) en attente de signature
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {enAttente.map((tx, idx) => (
              <div 
                key={`${tx.id}-${idx}`} 
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-card rounded-[24px] shadow-sm border border-amber-500/20 hover:border-amber-500 transition-all group cursor-pointer"
                onClick={() => router.push(`/commune/transactions/${tx.id}`)}
              >
                <div className="mb-4 sm:mb-0 flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Badge 
                      className={`rounded-lg font-black text-[10px] px-3 py-1 ${
                        tx.type === 'RECETTE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-rose-500/10 text-rose-600 border-rose-200'
                      }`}
                    >
                      {tx.type}
                    </Badge>
                    <p className="font-black text-lg text-foreground group-hover:text-primary transition-colors">{stripHtml(tx.description)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>{tx.categorie}</span>
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    <span className="italic">{tx.soumis_par_detail?.full_name || "Agent Financier"}</span>
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    <span>{tx.periode}</span>
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    <span>{formatDateShort(tx.created_at)}</span>
                  </div>
                  {tx.ipfs_hash && (
                    <a 
                      href={ipfsService.getPublicUrl(tx.ipfs_hash)}
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] font-black text-primary hover:bg-primary/10 flex items-center gap-1.5 mt-3 bg-primary/5 w-max px-3 py-1.5 rounded-xl border border-primary/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Preuve IPFS Scellée
                    </a>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                  <p className={`font-black text-2xl tabular-nums ${tx.type === 'RECETTE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'RECETTE' ? '+' : '−'} {formatFCFA(tx.montant_fcfa)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejectingId(tx.id);
                        setIsRejectModalOpen(true);
                      }}
                      disabled={signingId === tx.id || rejectingId === tx.id}
                      className="text-[10px] font-black px-4 py-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {rejectingId === tx.id && rejectLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      Rejeter
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValider(tx);
                      }}
                      disabled={signingId === tx.id || rejectingId === tx.id}
                      className="text-[10px] font-black px-5 py-3 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                      {signingId === tx.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3 h-3" />
                      )}
                      Signer sur Polygon
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      <div className="pt-4">
        <RecentTransactionsBlock txs={valides} title="Journal d'audit Blockchain (Validés)" viewAllHref="/commune/transactions" />
      </div>

      <Drawer isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)}>
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-8 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic text-destructive">Rejeter la transaction</DrawerTitle>
                <DrawerDescription className="text-muted-foreground font-medium italic mt-1">Veuillez indiquer le motif du rejet. Cette action est irréversible.</DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted"><XCircle className="w-5 h-5 text-muted-foreground" /></Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <form onSubmit={handleRejeterSubmit} className="px-8 py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Motif du rejet</label>
              <textarea 
                required
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
                placeholder="Ex: Facture non conforme, justificatif manquant..."
                className="w-full min-h-[120px] p-4 rounded-2xl border border-border bg-muted/30 focus:bg-card transition-all font-bold text-sm outline-none focus:ring-2 focus:ring-destructive/20"
              />
            </div>

            <div className="bg-destructive/5 border border-destructive/10 p-6 rounded-[24px] space-y-2">
              <p className="text-xs font-black text-destructive uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Attention
              </p>
              <p className="text-[11px] font-bold text-destructive/70 leading-relaxed italic">
                Le rejet annulera la transaction. L'agent financier devra soumettre une nouvelle demande après correction.
              </p>
            </div>

            <DrawerFooter className="px-0 pt-6 flex flex-row gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 h-16 rounded-[20px] font-black text-lg border-border hover:bg-muted"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={rejectLoading}
                className="flex-[2] bg-destructive hover:bg-destructive/90 text-white h-16 rounded-[20px] font-black text-lg shadow-2xl shadow-destructive/20 transition-all hover:scale-[1.01] active:scale-95"
              >
                {rejectLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : "Confirmer le rejet"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// ─── DGDDL ────────────────────────────────────────────────────────────────────
const DGDDLDashboard = () => {
  const { communes, count, loading, error } = useCommunesList();
  const { transactions } = useTransactionsList();
  const totalBudget = communes.reduce((s: number, c: any) => s + c.budget_annuel_fcfa, 0);
  const totalDepense = communes.reduce((s: number, c: any) => s + c.budget_depense_fcfa, 0);
  const soumises = transactions.filter(t => t.statut === 'SOUMIS').length;
  const sorted = [...communes].sort((a, b) => b.score_transparence - a.score_transparence);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Communes supervisées" value={count} icon={<Building2 />} />
        <StatsCard label="Budget national total" value={totalBudget} isCurrency icon={<Globe />} />
        <StatsCard label="Dépenses consolidées" value={totalDepense} isCurrency icon={<Activity />} />
        <StatsCard label="Alertes en attente" value={soumises} icon={<AlertTriangle />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-full">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Palmarès Transparence</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sorted.slice(0, 8).map((c, i) => (
                <div key={`${c.id}-${i}`} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black", i < 3 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground")}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{c.nom}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{c.region}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-black">{c.score_transparence}</span>
                    <ScoreBar score={c.score_transparence} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <AnomaliesWidget />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactionsBlock txs={transactions} title="Flux d'activité national" />
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANT : MODULE BAILLEUR (Extension Audit) ───────────────────────────
const BailleurModule = ({ verified }: { verified: boolean }) => {
  const { projets, loading } = useProjets();
  
  const totalInvesti = projets.reduce((s: number, p: any) => s + p.budget_alloue_fcfa, 0);
  const avgExec = projets.length > 0 ? projets.reduce((s: number, p: any) => s + p.taux_execution, 0) / projets.length : 0;

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-2xl" />;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary italic">Module Audit Bailleur</h3>
        {!verified && <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50">Vérification Requise pour Détails</Badge>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Projets financés" value={projets.length} icon={<Target className="w-4 h-4" />} />
        <StatsCard label="Total investi" value={totalInvesti} isCurrency icon={<Wallet className="w-4 h-4" />} />
        <StatsCard label="Exécution moyenne" value={`${Math.round(avgExec)}%`} icon={<Activity className="w-4 h-4" />} />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground italic">Suivi des financements internationaux</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projets.map((p: any) => (
            <div key={p.id} className={cn("relative transition-all", !verified && "grayscale opacity-60 pointer-events-none")}>
               <ProjetCard projet={{...p, nom: p.nom, budget_alloue_fcfa: p.budget_alloue_fcfa}} />
               {!verified && (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px] rounded-3xl">
                   <div className="bg-white/90 p-2 rounded-xl shadow-lg border border-border flex items-center gap-2">
                     <Lock className="w-3 h-3 text-amber-600" />
                     <span className="text-[10px] font-bold uppercase">Auditeur non certifié</span>
                   </div>
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── COMPOSANT : MODULE PRESSE (Extension Open Data) ─────────────────────────
const PresseModule = ({ verified }: { verified: boolean }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
       <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary italic">Module Investigation Presse</h3>
      </div>

      <Card className="rounded-[32px] border-dashed bg-blue-50/30 border-blue-200">
        <CardContent className="p-8 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Search className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-black mb-3">Centre d'Exportation Massive</h4>
          <p className="text-sm text-muted-foreground mb-6 font-medium leading-relaxed">
            Accédez à l'intégralité du registre national pour vos investigations. Filtrez par ODD, par commune ou par période.
          </p>
          
          {verified ? (
            <div className="flex flex-col w-full gap-3">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl">
                Exporter le Registre National (CSV)
              </Button>
              <Button variant="outline" className="w-full h-12 border-blue-200 text-blue-600 font-bold rounded-xl">
                Accès API REST Investigation
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-tighter">Accès Restreint</p>
                <p className="text-[11px] font-medium text-amber-700 mt-0.5 leading-snug">
                  La certification Journaliste est requise pour l'export massif de données sensibles.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── COUR DES COMPTES ─────────────────────────────────────────────────────────
const CourComptesDashboard = () => {
  const { transactions, count, loading, error } = useTransactionsList();
  const { communes } = useCommunesList();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Transactions auditées" value={count} icon={<FileTextIcon />} />
        <StatsCard label="Preuves blockchain valides" value={transactions.filter(t => t.blockchain_tx_hash_validation).length} icon={<ShieldCheck />} />
        <StatsCard label="Mairies connectées" value={communes.length} icon={<Building2 />} />
      </div>
      <Card>
        <CardHeader className="bg-red-500/5 border-b border-red-500/10">
          <CardTitle className="flex items-center gap-2 text-red-600 uppercase text-sm tracking-widest font-black">
            <ShieldCheck className="w-5 h-5" />
            Registre d'audit immuable (Livre blanc)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {transactions.map((tx, idx) => (
              <div key={`${tx.id}-${idx}`} className="p-5 hover:bg-muted/50 transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4">
                  <p className="font-bold text-foreground truncate">{tx.description}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{tx.categorie} · {formatDateShort(tx.validated_at ?? tx.created_at)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-black text-foreground tabular-nums">{formatFCFA(tx.montant_fcfa)}</p>
                </div>
                <div className="md:col-span-6 flex items-center justify-end gap-2 flex-wrap">
                  {tx.ipfs_hash && (
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                      IPFS: {tx.ipfs_hash.slice(0, 8)}…
                    </span>
                  )}
                  {tx.blockchain_tx_hash_validation ? (
                    <a
                      href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-mono font-bold text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-md hover:bg-purple-500/20 transition-colors"
                    >
                      TX: {truncateHash(tx.blockchain_tx_hash_validation, 6)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">En attente signature</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── UNIFIED PUBLIC DASHBOARD (Identity-First Logic) ──────────────────────────
const UnifiedPublicDashboard = ({ communeId, role }: { communeId: number | null, role: Role }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { communes, loading: lcLoading } = useCommunesList();
  
  // Logic: Everyone is a Citizen.
  // Verification check.
  const isVerified = user?.is_verified ?? false;
  const isExpert = user?.is_expert ?? false;

  const commune = communeId ? communes.find(c => c.id === communeId) ?? communes[0] : communes[0];
  const { transactions, loading, error } = useTransactionsList(commune ? { commune: commune.id } : undefined);

  if (lcLoading || loading) return <LoadingState />;
  if (!commune && role === 'CITOYEN') return <ErrorState msg="Commune introuvable." />;

  return (
    <div className="space-y-10">
      {/* 1. Identity & Verification Status */}
      {!isVerified && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 uppercase italic">Vérification de Sentinelle Requise</p>
              <p className="text-xs font-medium text-amber-700/80">Pour signaler une anomalie ou accéder aux audits, certifiez votre identité numérique.</p>
            </div>
          </div>
          <Button onClick={() => router.push('/public/certification')} className="bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-amber-600/20">
            Demander ma Certification →
          </Button>
        </motion.div>
      )}

      {/* 2. Citizen Base View (Hero) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[40px] bg-[#000040] text-white p-8 md:p-12 shadow-2xl border border-white/5"
      >
        <div className="absolute right-[-10%] top-[-10%] w-[60%] h-[120%] opacity-10 pointer-events-none mix-blend-overlay">
           <svg viewBox="0 0 400 400" className="w-full h-full">
             <path fill="currentColor" d="M43.5,-75.4C56.6,-66.1,67.6,-53.4,75.3,-39.1C82.9,-24.8,87.2,-8.8,85.2,6.5C83.2,21.9,74.9,36.5,63.9,48.4C53,60.3,39.4,69.5,24.4,76.5C9.4,83.5,-7.1,88.4,-22.4,85.1C-37.7,81.8,-51.9,70.3,-63.3,56.8C-74.8,43.3,-83.6,27.8,-87.3,11.2C-91.1,-5.4,-89.9,-23,-81.9,-37.2C-73.9,-51.4,-59.2,-62.3,-44.6,-70.6C-30,-78.9,-15,-84.7,0.8,-85.9C16.6,-87.1,33.2,-83.8,43.5,-75.4Z" transform="translate(200 200) scale(1.1)" />
           </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Ma Commune</Badge>
            {isVerified && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Citoyen Certifié</Badge>}
            {isExpert && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Expert Auditeur</Badge>}
          </div>

          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 italic">
            {commune ? commune.nom : "Vue Nationale"}
          </h2>
          {commune && <p className="text-xl font-bold text-white/50 italic mb-10">{commune.region} — Côte d'Ivoire</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[24px] border border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Budget Annuel</p>
              <p className="text-3xl font-black tabular-nums">{formatFCFA(commune?.budget_annuel_fcfa ?? 0)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[24px] border border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Dépenses Réelles</p>
              <p className="text-3xl font-black tabular-nums text-accent">{formatFCFA(commune?.budget_depense_fcfa ?? 0)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[24px] border border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Transparence</p>
              <p className="text-3xl font-black tabular-nums text-emerald-400">{commune?.score_transparence ?? 0}<span className="text-white/20 text-sm ml-1">/100</span></p>
            </div>
            <div className="flex items-center justify-center md:justify-end">
              <Button 
                disabled={!isVerified}
                className={cn(
                  "h-14 px-8 rounded-2xl font-black gap-2 transition-all shadow-xl shadow-black/20",
                  isVerified ? "bg-white text-[#000040] hover:bg-white/90" : "bg-white/10 text-white/40 cursor-not-allowed"
                )}
              >
                {!isVerified && <Lock className="w-4 h-4" />}
                Signaler une Anomalie
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Specialized Modules (The "Expert" extensions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Area (8/12) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Conditional Modules: role OR profession determines which module to show */}
          {(role === 'BAILLEUR' || user?.profession === 'BAILLEUR') && <BailleurModule verified={isVerified} />}
          {(role === 'JOURNALISTE' || user?.profession === 'JOURNALISTE' || user?.profession === 'ONG') && <PresseModule verified={isVerified} />}

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground italic flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Flux financier vérifiable (Dernières preuves)
                </h3>
                <Link href="/controle/blockchain" className="text-[10px] font-black uppercase text-primary hover:underline">
                  Voir sur Polygon
                </Link>
             </div>
             <RecentTransactionsBlock txs={transactions} title="" loading={loading} error={error} />
          </div>
        </div>

        {/* Sidebar Sidebar (4/12) */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="rounded-[32px] overflow-hidden border-none shadow-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
             <CardContent className="p-8">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                 <ShieldCheck className="w-6 h-6 text-accent" />
               </div>
               <h3 className="font-black text-xl mb-4 italic">Sentinelle de l'État</h3>
               <p className="text-sm text-primary-foreground/70 leading-relaxed font-medium">
                 En tant que citoyen certifié, vous devenez un auditeur décentralisé. Vos rapports sont enregistrés sur la blockchain et notifiés au Ministère de l'Intérieur.
               </p>
               <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                 <div>
                   <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ma Réputation</p>
                   <p className="text-2xl font-black">{user?.reputation_score ?? 0} pts</p>
                 </div>
                 <Badge className="bg-accent text-[#000040] border-none font-black text-[10px] uppercase tracking-tighter">Rang : Gardien</Badge>
               </div>
             </CardContent>
           </Card>

           <div className="space-y-4">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Services Innovants</h3>
             
             {[
               { id: 'vote', label: 'Budget Participatif', desc: 'Votez sur les futurs investissements.', icon: <Users />, color: 'emerald', path: '/public/vote' },
               { id: 'map', label: 'Atlas de la Transparence', desc: 'Cartographie des 201 communes.', icon: <Globe />, color: 'purple', path: '/public/carte' },
               { id: 'reports', label: 'Archives Publiques', desc: 'Accès aux rapports certifiés.', icon: <FileTextIcon />, color: 'blue', path: '/public/rapports' },
             ].map((s) => (
               <Card 
                key={s.id}
                className="group cursor-pointer hover:border-primary/50 transition-all border border-border shadow-sm rounded-[24px] overflow-hidden"
                onClick={() => router.push(s.path)}
               >
                 <CardContent className="p-5 flex items-center gap-4 bg-white hover:bg-muted/30 transition-colors">
                   <div className={cn(
                     "p-3 rounded-2xl group-hover:scale-110 transition-transform",
                     s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                     s.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                   )}>
                     {s.icon}
                   </div>
                   <div className="flex-1">
                     <p className="font-black text-sm text-foreground italic">{s.label}</p>
                     <p className="text-[11px] font-medium text-muted-foreground/80">{s.desc}</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
                 </CardContent>
               </Card>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};

// Just a small mock for the icon since I couldn't import FileText from lucide directly in previous block
const FileTextIcon = () => <Activity className="w-5 h-5" />;

// ─── Rendu principal ──────────────────────────────────────────────────────────
export const DashboardView = ({ role }: DashboardViewProps) => {
  const { user } = useAuth();
  const communeId = user?.commune ?? null;

  const renderDashboard = () => {
    switch (role) {
      case 'AGENT_FINANCIER': return communeId ? <AgentDashboard communeId={communeId} /> : <ErrorState msg="Aucune commune associée." />;
      case 'MAIRE':           return communeId ? <MaireDashboard communeId={communeId} /> : <ErrorState msg="Aucune commune associée." />;
      case 'DGDDL':           return <DGDDLDashboard />;
      case 'COUR_COMPTES':    return <CourComptesDashboard />;
      case 'BAILLEUR': 
      case 'CITOYEN': 
      case 'JOURNALISTE': 
        return <UnifiedPublicDashboard communeId={communeId} role={role} />;
      default:                return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tight">Tableau de bord</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-widest">{ROLE_LABELS[role]}</span>
            <span className="text-muted-foreground font-medium text-sm border-l border-border dark:border-gray-700 pl-2">Données en temps réel sur la blockchain</span>
          </div>
        </div>
      </div>
      {renderDashboard()}
    </div>
  );
};
