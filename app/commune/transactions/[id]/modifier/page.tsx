"use client";

import { useParams, useRouter } from "next/navigation";
import { useTransactionDetail } from "@/lib/hooks/useTransactions";
import { DepenseForm } from "@/components/agent/DepenseForm";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ModifierBrouillonPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { transaction: tx, loading, error } = useTransactionDetail(id);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chargement du brouillon...</p>
    </div>
  );

  if (error || !tx) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-black text-foreground">Brouillon introuvable</h3>
      <Button onClick={() => router.back()} className="mt-6">Retour</Button>
    </div>
  );

  if (tx.statut !== 'BROUILLON') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-foreground">Modification interdite</h3>
        <p className="text-muted-foreground mt-2">Cette transaction a déjà été soumise ou validée et ne peut plus être modifiée.</p>
        <Button onClick={() => router.back()} className="mt-6">Retour</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </button>
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Modifier le Brouillon</h2>
      </div>

      <DepenseForm 
        initialData={tx} 
        onSuccess={() => router.push("/commune/transactions")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
