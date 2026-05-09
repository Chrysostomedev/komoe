"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, ExternalLink, ShieldCheck, Loader2, AlertTriangle, XCircle, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCommuneTransactions } from "@/lib/hooks/useTransactions";
import { transactionsApi } from "@/lib/api";
import { formatFCFA, formatDateShort, polygonscanTxUrl, truncateHash, stripHtml } from "@/lib/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWriteContract, useAccount } from "wagmi";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { FormField, Input, RichTextEditor } from "@/components/ui/ReusableForm";

export default function ValidationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const communeId = user?.commune ?? null;
  const { transactions, loading, error, refetch } = useCommuneTransactions(communeId);
  
  if (user && user.role !== 'MAIRE') {
    // Redirection de sécurité : L'Agent Financier n'a pas accès à la file de validation
    if (typeof window !== 'undefined') {
      router.replace('/commune/dashboard');
    }
    return null;
  }
  
  const { writeContractAsync } = useWriteContract();
  const [signingId, setSigningId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const enAttente = transactions.filter((t) => t.statut === "SOUMIS");
  const confirmes = transactions.filter((t) => t.statut === "VALIDE");

  const handleValider = async (tx: any) => {
    if (!isConnected) {
      alert("Veuillez connecter votre portefeuille MetaMask en haut à droite.");
      return;
    }

    setSigningId(tx.id);
    try {
      // 1. Signature Blockchain via MetaMask
      console.log("Signature Blockchain demandée pour:", tx.id);
      
      const hash = await writeContractAsync({
        address: BUDGET_LEDGER_ADDRESS as `0x${string}`,
        abi: BUDGET_LEDGER_ABI,
        functionName: tx.type === 'RECETTE' ? 'enregistrerRecette' : 'validerDepense',
        args: [
          tx.id,
          String(tx.commune),
          BigInt(tx.montant_fcfa),
          tx.categorie,
          tx.ipfs_hash || "no-hash"
        ],
      });

      console.log("Transaction envoyée ! Hash:", hash);

      // 2. Mise à jour du Backend — on transmet le hash MetaMask (évite double signature backend)
      await transactionsApi.valider(tx.id, hash);
      
      alert("Validation réussie et enregistrée sur Polygon !");
      refetch();
    } catch (err: any) {
      console.error("Erreur de validation:", err);
      alert("Erreur lors de la signature : " + (err.shortMessage || "Échec de la transaction"));
    } finally {
      setSigningId(null);
    }
  };

  const handleRejeterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId || !rejectMotif.trim()) return;

    setRejectLoading(true);
    try {
      await transactionsApi.rejeter(rejectingId, rejectMotif.trim());
      setIsRejectModalOpen(false);
      setRejectingId(null);
      setRejectMotif("");
      refetch();
    } catch (err: any) {
      alert("Erreur lors du rejet : " + (err?.message || "Échec"));
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronisation de la file...</span>
    </div>
  );

  if (error) return (
    <div className="p-8 bg-red-50 dark:bg-red-900/10 rounded-[32px] border border-red-200 text-red-600 flex items-center gap-4">
      <AlertTriangle className="w-6 h-6" />
      <span className="font-bold">{error}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">File de signature</h2>
          <p className="text-muted-foreground mt-1 font-medium">
            Approuvez les flux financiers — Chaque validation est gravée sur le réseau <span className="text-purple-600 font-bold">Polygon</span>.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-border">
          <Info className="text-primary w-5 h-5" />
          <p className="text-xs font-bold leading-relaxed max-w-[200px]">
            La signature nécessite un compte administrateur autorisé.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-[24px] shadow-sm border-amber-200 bg-amber-50/20"><CardContent className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">En attente</p>
          <p className="text-4xl font-black text-amber-600">{enAttente.length}</p>
        </CardContent></Card>
        <Card className="rounded-[24px] shadow-sm border-emerald-200 bg-emerald-50/20"><CardContent className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Total Validées</p>
          <p className="text-4xl font-black text-emerald-600">{confirmes.length}</p>
        </CardContent></Card>
        <Card className="rounded-[24px] shadow-sm border-border"><CardContent className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Volume à signer</p>
          <p className="text-3xl font-black text-foreground">{formatFCFA(enAttente.reduce((s, t) => s + t.montant_fcfa, 0))}</p>
        </CardContent></Card>
      </div>

      {enAttente.length > 0 && (
        <Card className="border-2 border-amber-400/50 rounded-[32px] overflow-hidden shadow-xl">
          <CardHeader className="bg-amber-400/10 border-b border-amber-400/20 p-6">
            <CardTitle className="flex items-center gap-3 text-amber-800 dark:text-amber-500 font-black uppercase tracking-widest text-sm">
              <CheckCircle className="w-5 h-5 animate-pulse" />
              Signature Blockchain requise
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-200/30">
              {enAttente.map((tx) => (
                <div 
                  key={tx.id} 
                  className="p-8 hover:bg-amber-50/50 transition-all group cursor-pointer"
                  onClick={() => router.push(`/commune/transactions/${tx.id}`)}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={`rounded-lg font-black text-[10px] px-3 py-1 ${
                            tx.type === 'RECETTE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-rose-500/10 text-rose-600 border-rose-200'
                          }`}
                        >
                          {tx.type}
                        </Badge>
                        <p className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                          {stripHtml(tx.description.split("[REJET")[0].trim())}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <Badge variant="outline" className="rounded-lg font-bold border-muted-foreground/20 text-muted-foreground bg-muted/5 italic">
                          {tx.categorie}
                        </Badge>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="opacity-50">Saisi par :</span>
                          <span className="text-foreground">{tx.soumis_par_detail?.full_name || "Agent Financier"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="opacity-50">Période :</span>
                          <span className="text-foreground">{tx.periode}</span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest ml-auto">
                          {formatDateShort(tx.created_at)}
                        </span>
                        {tx.ipfs_hash && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                             <ExternalLink size={12} /> Preuve IPFS
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-row items-center gap-8 w-full lg:w-auto">
                      <div className="text-left lg:text-right min-w-[150px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Montant</p>
                        <p className={`text-2xl font-black tabular-nums ${tx.type === 'RECETTE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'RECETTE' ? '+' : '−'} {formatFCFA(tx.montant_fcfa)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-auto">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValider(tx);
                          }}
                          disabled={signingId === tx.id}
                          className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-6 font-black text-xs gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          {signingId === tx.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                          Valider la transaction
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectingId(tx.id);
                            setIsRejectModalOpen(true);
                          }}
                          className="text-rose-600 hover:bg-rose-50 rounded-xl h-12 w-12 p-0"
                        >
                          <XCircle size={20} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[32px] overflow-hidden border shadow-lg">
        <CardHeader className="bg-muted/30 border-b border-border p-6">
          <CardTitle className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-sm">
            <CheckCircle className="w-5 h-5" />
            Archive des Preuves Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {confirmes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
               <ShieldCheck className="w-16 h-16 mb-4" />
               <p className="font-black uppercase tracking-widest text-xs">Aucun sceau numérique enregistré</p>
            </div>
          )}
          <div className="divide-y divide-border">
            {confirmes.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all cursor-pointer"
                onClick={() => router.push(`/commune/transactions/${tx.id}`)}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                       tx.type === 'RECETTE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {tx.type}
                    </span>
                    <p className="font-black text-foreground">{stripHtml(tx.description)}</p>
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Validé le {formatDateShort(tx.validated_at ?? tx.created_at)} · {tx.soumis_par_detail?.full_name || "Agent"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {tx.blockchain_tx_hash_validation && (
                    <a
                      href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] font-mono font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-2"
                    >
                      {truncateHash(tx.blockchain_tx_hash_validation, 6)} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Badge variant="success" className="rounded-lg h-8 px-4 font-black">VALIDÉ</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Rejet */}
      <Drawer 
        isOpen={isRejectModalOpen} 
        onClose={() => setIsRejectModalOpen(false)} 
        title="Rejeter la transaction"
        description="Veuillez spécifier le motif du rejet. Cette action est irréversible et sera notifiée à l'agent financier."
      >
        <DrawerContent>
          <form className="space-y-8 pt-4" onSubmit={handleRejeterSubmit}>
            <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-sm font-medium leading-relaxed italic">
              <span className="font-black uppercase tracking-widest text-xs block mb-1">Avertissement Audit</span>
              Le rejet sera archivé dans le journal de transparence de la commune. L&apos;agent pourra modifier et soumettre à nouveau après correction.
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Motif du rejet</label>
              <RichTextEditor
                name="motif"
                placeholder="Veuillez expliquer pourquoi cette transaction est rejetée..."
                onChange={(val: string) => setRejectMotif(val)}
              />
            </div>

            <div className="pt-8 border-t border-border flex justify-end gap-4 pb-10">
               <Button variant="ghost" type="button" onClick={() => { setIsRejectModalOpen(false); setRejectMotif(""); }} className="font-bold rounded-xl h-14 px-8">Annuler</Button>
               <Button 
                type="submit" 
                disabled={rejectLoading || !rejectMotif.trim()} 
                className="bg-rose-600 hover:bg-rose-700 text-white min-w-[200px] h-14 rounded-2xl font-black text-lg shadow-xl shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-95"
               >
                 {rejectLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmer le Rejet"}
               </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
