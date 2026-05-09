"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PieChart, ArrowDownRight, ArrowUpRight, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCommuneDetail } from "@/lib/hooks/useCommunes";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { formatFCFA, formatDateShort, polygonscanTxUrl, truncateHash } from "@/lib/constants";

export default function BudgetPage() {
  const { user } = useAuth();
  const communeId = user?.commune ?? null;
  const { commune, loading: lcLoading } = useCommuneDetail(communeId);
  const { transactions, loading: ltLoading } = useTransactionsList(
    communeId ? { commune: communeId } : undefined,
    !!communeId
  );
  const loading = lcLoading || ltLoading;
  const txs = transactions;
  const depenses = txs.filter((t) => t.type === "DEPENSE");
  const recettes = txs.filter((t) => t.type === "RECETTE");
  const execRate = commune && commune.budget_annuel_fcfa > 0
    ? ((commune.budget_depense_fcfa / commune.budget_annuel_fcfa) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Budget en temps réel</h2>
        <p className="text-muted-foreground mt-1 text-sm">Commune de {commune?.nom ?? "…"} — données blockchain vérifiables</p>
      </div>

      {/* Vue commune */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-2xl">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">{commune?.nom ?? "…"} — Budget 2026</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-primary-foreground/70 text-xs">Budget alloué</p>
              <p className="font-bold text-lg">{commune ? formatFCFA(commune.budget_annuel_fcfa) : "…"}</p>
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs">Dépensé</p>
              <p className="font-bold text-lg text-accent">{commune ? formatFCFA(commune.budget_depense_fcfa) : "…"}</p>
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs">Restant</p>
              <p className="font-bold text-lg text-emerald-300">{commune ? formatFCFA(commune.budget_annuel_fcfa - commune.budget_depense_fcfa) : "…"}</p>
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs">Taux exécution</p>
              <p className="font-bold text-lg">{execRate}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-primary-foreground/20 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${execRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground mb-1">Score transparence</p>
          <p className="text-2xl font-bold text-emerald-600">{commune?.score_transparence ?? "…"}/100</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground mb-1">Dépenses confirmées</p>
          <p className="text-2xl font-bold text-foreground">{depenses.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground mb-1">Recettes enregistrées</p>
          <p className="text-2xl font-bold text-foreground">{recettes.length}</p>
        </CardContent></Card>
      </div>

      {/* Transactions publiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-accent" />
            Dépenses publiques vérifiables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="flex justify-center py-8 text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" />Chargement…</div>}
          {!loading && txs.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted transition">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${tx.type === "DEPENSE" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                  {tx.type === "DEPENSE" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatDateShort(tx.created_at)}</span>
                    {tx.blockchain_tx_hash_validation && (
                      <a href={polygonscanTxUrl(tx.blockchain_tx_hash_validation)} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded hover:underline flex items-center gap-1">
                        {truncateHash(tx.blockchain_tx_hash_validation, 4)} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className={`font-bold ${tx.type === "DEPENSE" ? "text-rose-600" : "text-emerald-600"}`}>
                  {tx.type === "DEPENSE" ? "−" : "+"}{formatFCFA(tx.montant_fcfa)}
                </p>
                <Badge variant="success">Confirmé</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
