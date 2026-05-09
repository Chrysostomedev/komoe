"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download, FileText, Table, CheckCircle } from "lucide-react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { formatFCFA, stripHtml } from "@/lib/utils";

export default function ExportPage() {
  const { communes } = useCommunesList();
  const { transactions: txs } = useTransactionsList();

  const exportCSV = (data: object[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const rows = [keys.join(","), ...data.map((r: any) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCommunesCSV = () => exportCSV(
    communes.map((c) => ({
      id: c.id, nom: c.nom, region: c.region,
      budget_alloue: c.budget_annuel_fcfa, budget_depense: c.budget_depense_fcfa,
      score_transparence: c.score_transparence,
    })),
    "komoe_communes_export.csv"
  );

  const exportTransactionsCSV = () => exportCSV(
    txs.filter((t) => t.blockchain_tx_hash_validation).map((t) => ({
      id: t.id, type: t.type, montant: t.montant_fcfa, categorie: t.categorie,
      description: stripHtml(t.description), commune_id: t.commune, statut: t.statut,
      date: t.created_at, tx_hash: t.blockchain_tx_hash_validation,
      ipfs_hash: t.ipfs_hash ?? "",
    })),
    "komoe_transactions_blockchain.csv"
  );

  const EXPORTS = [
    {
      titre: "Communes CI — Données complètes",
      desc: `${communes.length} communes · budgets · scores transparence`,
      icone: Table,
      taille: "~12 KB",
      action: exportCommunesCSV,
    },
    {
      titre: "Transactions blockchain vérifiées",
      desc: `${txs.filter((t) => t.blockchain_tx_hash_validation).length} transactions · hash Polygon · IPFS`,
      icone: CheckCircle,
      taille: "~8 KB",
      action: exportTransactionsCSV,
    },
    {
      titre: "Toutes les transactions validées",
      desc: `${txs.length} transactions validées`,
      icone: FileText,
      taille: "~14 KB",
      action: () => exportCSV(txs.map(t => ({ id: t.id, type: t.type, montant: t.montant_fcfa, statut: t.statut, commune: t.commune, description: stripHtml(t.description) })), "komoe_toutes_transactions.csv"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Export CSV / API</h2>
        <p className="text-muted-foreground mt-1 text-sm">Téléchargez les données ouvertes KOMOE pour analyse externe</p>
      </div>

      {/* Stats export */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Communes disponibles</p>
          <p className="text-2xl font-bold text-foreground">{communes.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transactions exportables</p>
          <p className="text-2xl font-bold text-foreground">{txs.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volume total</p>
          <p className="text-2xl font-bold text-foreground">{formatFCFA(txs.reduce((s, t) => s + t.montant_fcfa, 0))}</p>
        </CardContent></Card>
      </div>

      {/* Exports disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-foreground" />
            Exports disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {EXPORTS.map(({ titre, desc, icone: Icon, taille, action }) => (
            <div key={titre} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#000040]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{titre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-muted-foreground hidden sm:block">{taille}</span>
                <button
                  onClick={action}
                  className="flex items-center gap-2 bg-[#000040] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#000060] transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Note API */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-5">
          <p className="font-semibold text-foreground mb-1">API REST ouverte</p>
          <p className="text-sm text-muted-foreground mb-3">
            Les données sont également accessibles via l&apos;API Django REST. Authentification Bearer JWT requise.
          </p>
          <div className="space-y-1 font-mono text-xs text-foreground">
            <p className="bg-card border border-blue-100 px-3 py-1.5 rounded-lg">GET /api/communes/</p>
            <p className="bg-card border border-blue-100 px-3 py-1.5 rounded-lg">GET /api/transactions/</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
