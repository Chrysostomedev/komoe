"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ExternalLink, ArrowLeft, FileText, CheckCircle2, Loader2, AlertTriangle, Hash, Calendar, Tag, Wallet, Activity, ShieldCheck, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTransactionDetail } from "@/lib/hooks/useTransactions";
import { formatFCFA, formatDateShort, polygonscanTxUrl, truncateHash, stripHtml } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { transactionsApi } from "@/lib/api";
import { useState } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";
export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  const { transaction: tx, loading, error, refetch } = useTransactionDetail(id);
  const [actionLoading, setActionLoading] = useState(false);
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const handleValiderMaire = async () => {
    if (!isConnected) { alert("Connectez votre portefeuille Maire."); return; }
    if (!confirm("Voulez-vous SIGNER et VALIDER cette transaction sur la blockchain ?")) return;
    
    setActionLoading(true);
    try {
      const txHash = await writeContractAsync({
        address: BUDGET_LEDGER_ADDRESS,
        abi: BUDGET_LEDGER_ABI,
        functionName: "validerDepense",
        args: [
          tx.id, 
          String(tx.commune), 
          BigInt(tx.montant_fcfa), 
          tx.categorie, 
          tx.ipfs_hash || "no-hash"
        ],
      });

      // 2. Notification au backend avec le hash du Maire
      await transactionsApi.valider(id, txHash);
      alert("Transaction validée avec succès sur Polygon !");
      await refetch();
    } catch (err: any) {
      alert("Erreur de validation : " + (err.message || "Action annulée"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoumettreAgent = async () => {
    if (!isConnected) { alert("Connectez votre portefeuille Agent."); return; }
    if (!tx) return;

    setActionLoading(true);
    try {
      const txHash = await writeContractAsync({
        address: BUDGET_LEDGER_ADDRESS,
        abi: BUDGET_LEDGER_ABI,
        functionName: tx.type === "RECETTE" ? "enregistrerRecette" : "soumettreDepense",
        args: [
          tx.id,
          String(tx.commune),
          BigInt(tx.montant_fcfa),
          tx.categorie,
          tx.ipfs_hash || "no-hash",
        ],
      });

      await transactionsApi.confirmerHash(id, txHash);
      alert("Transaction signée et soumise au Maire !");
      await refetch();
    } catch (err: any) {
      alert("Erreur de signature : " + (err.message || "Action annulée"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSupprimer = async () => {
    if (!confirm("Supprimer ce brouillon définitivement ?")) return;
    setActionLoading(true);
    try {
      await transactionsApi.delete(id);
      router.push("/commune/transactions");
    } catch (err) {
      alert("Erreur lors de la suppression.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Récupération des preuves sur Polygon...</p>
    </div>
  );

  if (error || !tx) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-[32px] border border-red-100 dark:border-red-900/30">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-foreground">Transaction introuvable</h3>
        <p className="text-muted-foreground mt-2">L'identifiant fourni ne correspond à aucune donnée enregistrée sur la blockchain Komoe.</p>
        <Button onClick={() => router.back()} className="mt-6 bg-red-600 text-white hover:bg-red-700 rounded-xl px-8">Retour</Button>
      </div>
    </div>
  );

  const isAuthor = user?.id === tx.soumis_par_detail?.id;
  const canValider = user?.role === 'MAIRE' && tx.statut === 'SOUMIS';
  const canSignerDraft = isAuthor && tx.statut === 'BROUILLON';

  // Extraction du motif de rejet si présent dans la description
  const parseDescription = (desc: string) => {
    const rejectMatch = desc.match(/\[REJET — .*\] (.*)$/);
    if (rejectMatch) {
      return {
        text: stripHtml(desc.split("[REJET")[0].trim()),
        motif: rejectMatch[1]
      };
    }
    return { text: stripHtml(desc), motif: null };
  };

  const { text: cleanDescription, motif: rejectionMotif } = parseDescription(tx.description);

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour au registre
        </button>
        <div className="flex items-center gap-3">
          {canValider && (
            <Button 
              onClick={handleValiderMaire} 
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-6 h-10 shadow-lg shadow-emerald-200 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck size={16} />}
              {actionLoading ? "Signature..." : "Signer & Valider (Maire)"}
            </Button>
          )}
          {canSignerDraft && (
            <div className="flex gap-3">
              <Button 
                onClick={handleSupprimer} 
                variant="outline"
                disabled={actionLoading}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold rounded-xl px-4 h-10"
              >
                Supprimer
              </Button>
              <Link href={`/commune/transactions/${id}/modifier`}>
                <Button 
                  variant="outline"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50 font-bold rounded-xl px-4 h-10 flex items-center gap-2"
                >
                  <Pencil size={16} /> Modifier
                </Button>
              </Link>
              <Button 
                onClick={handleSoumettreAgent} 
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl px-6 h-10 shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity size={16} />}
                {actionLoading ? "Soumission..." : "Signer & Envoyer au Maire"}
              </Button>
            </div>
          )}
          {tx.blockchain_tx_hash_validation && (
            <a 
              href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-black text-purple-600 hover:text-purple-700 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-900/30 transition-all"
            >
              <ExternalLink size={14} /> Explorer sur Polygonscan
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-card border border-border p-8 rounded-[40px] shadow-2xl shadow-primary/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black text-foreground tracking-tight">Détails du Flux</h2>
            <Badge 
              variant={tx.statut === 'VALIDE' ? 'success' : tx.statut === 'REJETE' ? 'destructive' : 'secondary'} 
              className="h-8 px-4 text-xs font-black rounded-full"
            >
              {tx.statut === 'VALIDE' ? 'SCELLÉ SUR POLYGON' : tx.statut === 'REJETE' ? 'REJETÉ PAR LE MAIRE' : tx.statut === 'BROUILLON' ? 'BROUILLON (NON SIGNÉ)' : 'EN ATTENTE DE SIGNATURE'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
            <Hash size={14} />
            <span>ID Transaction : {tx.id}</span>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Montant Certifié</p>
          <p className={`text-4xl font-black tabular-nums ${tx.type === 'DEPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {tx.type === 'DEPENSE' ? '−' : '+'} {formatFCFA(tx.montant_fcfa)}
          </p>
        </div>
      </div>

      {tx.statut === 'REJETE' && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 rounded-[32px] overflow-hidden border">
          <CardContent className="p-8 flex items-start gap-6">
            <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-2xl text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-800 dark:text-red-400 uppercase tracking-wider mb-2">Décision de Rejet de l'Autorité</h3>
              <p className="text-red-700 dark:text-red-300 font-medium leading-relaxed">
                <span className="font-black">Motif :</span> {rejectionMotif || "Non spécifié"}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-widest">
                <span>Par : {tx.valide_par_detail?.full_name || "Monsieur le Maire"}</span>
                <span className="w-1 h-1 bg-red-300 rounded-full" />
                <span>Le : {tx.validated_at ? new Date(tx.validated_at).toLocaleString() : "Date inconnue"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border">
            <CardContent className="p-10">
              <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
                <FileText className="text-primary" /> Informations Budgétaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} /> Objet de la dépense
                  </p>
                  <p className="text-xl font-bold text-foreground leading-snug">{cleanDescription}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Date d'exécution
                  </p>
                  <p className="text-xl font-bold text-foreground">{new Date(tx.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Catégorie Budgétaire
                  </p>
                  <Badge variant="outline" className="text-base font-bold px-4 py-1.5 rounded-xl border-border bg-muted/50">{tx.categorie}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={12} /> Soumis par
                  </p>
                  <p className="text-lg font-bold text-foreground">{tx.soumis_par_detail?.full_name || "Agent Financier"}</p>
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-border pt-8 mt-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-purple-500" /> Preuve Cryptographique d'Immuabilité (Proof-of-Receipt)
                  </p>
                  <div className="bg-muted/50 border border-border p-5 rounded-[24px] font-mono text-xs text-muted-foreground break-all leading-relaxed shadow-inner">
                    {tx.blockchain_tx_hash_validation || tx.blockchain_tx_hash_soumission || (tx.statut === 'BROUILLON' ? "En attente de signature agent..." : "Génération du hash en cours sur le réseau Polygon...")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border">
            <CardContent className="p-10">
              <h3 className="text-xl font-black text-foreground mb-8">Processus d'Approbation Multisig</h3>
              
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
                <div className="relative flex items-center gap-6 group">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border-4 border-background shrink-0 z-10 shadow-lg ${tx.statut === 'VALIDE' ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div className={`flex-1 p-6 rounded-[24px] border ${tx.statut === 'VALIDE' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="font-black text-foreground">Validation & Signature Maire</div>
                      <time className="font-mono text-[10px] font-bold text-muted-foreground uppercase">{tx.validated_at ? new Date(tx.validated_at).toLocaleString() : "En attente..."}</time>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">Le Maire a apposé sa signature électronique via MetaMask. La transaction est devenue immuable sur le bloc Polygon Amoy.</p>
                  </div>
                </div>

                <div className="relative flex items-center gap-6 group">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border-4 border-background shrink-0 z-10 shadow-lg ${tx.statut !== 'BROUILLON' ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div className={`flex-1 p-6 rounded-[24px] border ${tx.statut !== 'BROUILLON' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="font-black text-foreground">Soumission Agent Financier</div>
                      <time className="font-mono text-[10px] font-bold text-muted-foreground uppercase">{new Date(tx.created_at).toLocaleString()}</time>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">Saisie initiale des données et téléversement des justificatifs sur IPFS. Hash de soumission généré.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden bg-muted/30 border">
            <CardContent className="p-8">
              <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Justificatifs IPFS
              </h3>
              <div className="space-y-4">
                <div className="group flex items-center gap-4 p-4 bg-card rounded-[24px] border border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors"><FileText size={20} /></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-foreground truncate uppercase tracking-tighter">Facture_Prestation.pdf</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Sceau IPFS : {tx.ipfs_hash ? tx.ipfs_hash.slice(0, 12) + "..." : "QmXv...9a2f"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-primary/5 rounded-[24px] border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Note Transparence</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Ces documents sont stockés sur le réseau IPFS et liés par hash à cette transaction, les rendant inaltérables même par les administrateurs.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-primary/20 rounded-[40px] overflow-hidden bg-primary text-white border">
            <CardContent className="p-8 space-y-4 text-center">
               <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
               </div>
               <h3 className="text-xl font-black leading-tight">Vérification Blockchain</h3>
               <p className="text-sm text-white/70 leading-relaxed">Cette transaction est gravée sur la chaîne Polygon Amoy.</p>
               <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl font-black mt-4 h-12">
                 Vérifier le Reçu JSON
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
