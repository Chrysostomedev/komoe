"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText, Download, Calendar, CheckCircle, Loader2, Search, Info } from "lucide-react";
import { formatFCFA } from "@/lib/constants";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const RAPPORTS = [
  { id: "R1", titre: "Rapport de transparence T1 2026 — National", type: "Trimestriel", date: "2026-04-01", statut: "Publié", size: "2.4 MB" },
  { id: "R2", titre: "Rapport sectoriel — Infrastructures & ODD 9", type: "Sectoriel", date: "2026-03-20", statut: "Publié", size: "1.8 MB" },
  { id: "R3", titre: "Audit blockchain — Intégrité Polygon Amoy", type: "Audit", date: "2026-03-01", statut: "Publié", size: "0.5 MB" },
  { id: "R4", titre: "Rapport budget 2025 — Exécution finale", type: "Annuel", date: "2026-01-15", statut: "Publié", size: "3.1 MB" },
  { id: "R5", titre: "Rapport d'activité KOMOE — Bilan Phase 1", type: "Interne", date: "2026-02-01", statut: "Archivé", size: "4.2 MB" },
];

const TYPE_COLORS: Record<string, "success" | "secondary" | "outline" | "destructive"> = {
  Trimestriel: "success", Sectoriel: "secondary", Audit: "outline",
  Annuel: "success", Interne: "outline",
};

export default function RapportsPublicsPage() {
  const { communes } = useCommunesList();
  const { transactions } = useTransactionsList();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const totalBudget = communes.reduce((s, c) => s + c.budget_annuel_fcfa, 0);

  const filteredRapports = RAPPORTS.filter(r => {
    const matchesSearch = r.titre.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter ? r.type === filter : true;
    return matchesSearch && matchesFilter;
  });

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Génération d'un CSV réel avec les données publiques de la blockchain
    const headers = ["ID", "Commune", "Type", "Montant FCFA", "Catégorie", "Description", "Statut", "Validation Blockchain (Hash)", "Date"];
    const rows = transactions.map(tx => [
      tx.id,
      tx.commune_detail?.nom || tx.commune,
      tx.type,
      tx.montant_fcfa,
      tx.categorie,
      tx.description.replace(/,/g, ' '),
      tx.statut,
      tx.blockchain_tx_hash_validation || "N/A",
      tx.created_at
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Komoe_Public_Export_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloadingId(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Rapports & Audits</h2>
          <p className="text-muted-foreground mt-1 font-medium italic">Documents officiels — librement accessibles en données ouvertes (Open Data)</p>
        </div>
        <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-border">
          <Info className="text-primary w-5 h-5" />
          <p className="text-xs font-bold leading-relaxed max-w-[250px]">
            Ces documents sont certifiés conformes aux données inscrites en Blockchain.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-[24px] border-border/50 shadow-sm"><CardContent className="p-6">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Budget national consolidé</p>
          <p className="text-xl font-black text-foreground">{formatFCFA(totalBudget)}</p>
        </CardContent></Card>
        <Card className="rounded-[24px] border-border/50 shadow-sm"><CardContent className="p-6">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Rapports certifiés</p>
          <p className="text-3xl font-black text-emerald-600">{RAPPORTS.filter(r => r.statut === "Publié").length}</p>
        </CardContent></Card>
        <Card className="rounded-[24px] border-border/50 shadow-sm"><CardContent className="p-6">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Périmètre d'audit</p>
          <p className="text-3xl font-black text-foreground">{communes.length} Communes</p>
        </CardContent></Card>
      </div>

      <Card className="rounded-[32px] overflow-hidden border shadow-xl">
        <CardHeader className="bg-muted/30 border-b border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-foreground font-black uppercase tracking-widest text-sm">
            <FileText className="w-5 h-5" />
            Documents publics disponibles
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              />
            </div>
            <div className="flex items-center gap-2">
              {['Trimestriel', 'Audit', 'Annuel'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(filter === t ? null : t)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === t ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredRapports.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground font-bold italic">Aucun document ne correspond à votre recherche.</div>
            ) : filteredRapports.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-foreground group-hover:text-primary transition-colors">{r.titre}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Badge variant={TYPE_COLORS[r.type] ?? "outline"} className="rounded-lg px-3 py-0.5 text-[9px] font-black">
                        {r.type.toUpperCase()}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        <Calendar className="w-3.5 h-3.5" />
                        {r.date}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground/60">{r.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <Badge variant={r.statut === "Publié" ? "success" : "outline"} className="rounded-lg h-8 px-4 font-black">
                    {r.statut === "Publié" && <CheckCircle className="w-3.5 h-3.5 mr-2" />}
                    {r.statut.toUpperCase()}
                  </Badge>
                  <Button 
                    variant="outline"
                    onClick={() => handleDownload(r.id)}
                    disabled={downloadingId === r.id}
                    className="h-12 w-12 rounded-xl border-border hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    {downloadingId === r.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
