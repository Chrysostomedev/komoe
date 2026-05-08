"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, ExternalLink, Loader2, AlertTriangle, Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCommuneTransactions } from "@/lib/hooks/useTransactions";
import { formatFCFA, formatDateShort } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { transactionsApi } from "@/lib/api";
import Link from "next/link";

export default function EnAttentePage() {
  const { user } = useAuth();
  const router = useRouter();
  const communeId = user?.commune ?? null;
  const { transactions, loading, error, refetch } = useCommuneTransactions(communeId);
  const enAttente = transactions.filter(
    (t) => t.statut === "SOUMIS" || t.statut === "BROUILLON"
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce brouillon ?")) return;
    try {
      await transactionsApi.delete(id);
      refetch();
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Validation en attente</h2>
          <p className="text-muted-foreground mt-1 font-medium text-sm">Transactions soumises au Maire — en attente de signature Polygon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">En attente Maire</p>
            <p className="text-3xl font-black text-amber-600">{enAttente.filter(t => t.statut === "SOUMIS").length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Brouillons</p>
            <p className="text-3xl font-black text-foreground">{enAttente.filter(t => t.statut === "BROUILLON").length}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Encours total</p>
            <p className="text-2xl font-black text-foreground">{formatFCFA(enAttente.reduce((s, t) => s + t.montant_fcfa, 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground">
            <Clock className="w-4 h-4 text-amber-500" />
            Registre des transactions en attente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading && <div className="flex flex-col items-center gap-2 py-16 justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Synchronisation...</span>
            </div>}
            {error && <div className="flex items-center gap-3 p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold m-4 rounded-2xl border border-red-200 dark:border-red-900/30">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>}
            {!loading && !error && enAttente.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-bold text-sm">Aucune transaction en attente.</p>
              </div>
            )}
            {!loading && !error && enAttente.map((tx) => (
              <div 
                key={tx.id} 
                onClick={() => router.push(`/commune/transactions/${tx.id}`)}
                className="flex items-center justify-between p-6 hover:bg-muted/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${tx.statut === "SOUMIS" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{tx.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{tx.categorie}</span>
                      <span className="w-1 h-1 rounded-full bg-border"></span>
                      <span className="text-[10px] font-bold text-muted-foreground">{formatDateShort(tx.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="hidden sm:block">
                    <p className="font-black text-foreground tabular-nums">{formatFCFA(tx.montant_fcfa)}</p>
                    <div className="flex justify-end mt-1">
                      <Badge variant={tx.statut === "SOUMIS" ? "secondary" : "outline"} className="text-[9px] h-5">
                        {tx.statut === "SOUMIS" ? "EN ATTENTE MAIRE" : "BROUILLON"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.statut === "BROUILLON" && (
                      <>
                        <Link href={`/commune/transactions/${tx.id}/modifier`} onClick={(e) => e.stopPropagation()}>
                          <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-all">
                            <Pencil className="w-4 h-4" />
                          </div>
                        </Link>
                        <div 
                          onClick={(e) => handleDelete(e, tx.id)}
                          className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </div>
                      </>
                    )}
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
