"use client";

import DataTable, { ColumnConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCommuneTransactions, STATUT_LABELS, STATUT_VARIANT } from "@/lib/hooks/useTransactions";
import { type Transaction, transactionsApi } from "@/lib/api";
import { DepenseForm } from "@/components/agent/DepenseForm";
import StatsCard from "@/components/ui/StatsCard";
import { Receipt, Wallet, ArrowDownRight, Pencil, Trash2, FileText } from "lucide-react";
import { formatFCFA, stripHtml } from "@/lib/constants";

import { useCommuneDetail } from "@/lib/hooks/useCommunes";

export default function DepensesCommune() {
  const { user } = useAuth();
  const communeId = user?.commune ?? null;
  const { transactions, loading, refetch } = useCommuneTransactions(communeId);
  const { commune } = useCommuneDetail(communeId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  if (user && user.role !== 'AGENT_FINANCIER') {
    if (typeof window !== 'undefined') {
      import("next/navigation").then((mod) => {
        mod.useRouter().replace('/commune/dashboard');
      });
    }
    return null;
  }
  
  const depenses = transactions.filter(t => t.type === 'DEPENSE');
  const totalDepense = depenses.reduce((acc, t) => acc + (t.statut === 'VALIDE' ? t.montant_fcfa : 0), 0);
  const budgetAnnuel = commune?.budget_annuel_fcfa ?? 0;
  const consommation = budgetAnnuel > 0 ? (totalDepense / budgetAnnuel) * 100 : 0;

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    try {
      await transactionsApi.delete(id);
      refetch();
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const columns: ColumnConfig<Transaction>[] = [
    {
      header: 'Type',
      key: 'type',
      render: (val) => (
        <Badge variant="destructive" className="rounded-full px-3">
          ↓ Dépense
        </Badge>
      )
    },
    {
      header: 'Description',
      key: 'description',
      render: (val, item) => (
        <div>
          <div className="font-black text-foreground line-clamp-1">{stripHtml(val)}</div>
          <div className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest bg-primary/5 w-fit px-2 py-0.5 rounded-md border border-primary/10">{item.categorie}</div>
        </div>
      )
    },
    {
      header: 'Montant',
      key: 'montant_fcfa',
      render: (val) => <span className="font-black text-rose-600 tabular-nums">-{formatFCFA(val)}</span>
    },
    {
      header: 'Date',
      key: 'created_at',
      render: (val) => <span className="text-muted-foreground font-medium text-sm">{new Date(val).toLocaleDateString('fr-FR')}</span>
    },
    {
      header: 'Statut',
      key: 'statut',
      render: (val) => (
        <Badge variant={STATUT_VARIANT[val] as any ?? 'outline'}>
          {STATUT_LABELS[val] ?? val}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (val, item) => (
        <div className="flex items-center gap-2">
          <Link href={`/commune/transactions/${val}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <FileText className="w-4 h-4" />
            </Button>
          </Link>
          {item.statut === 'BROUILLON' && (
            <>
              <Link href={`/commune/transactions/${val}/modifier`}>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-amber-600">
                  <Pencil className="w-4 h-4" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-rose-600"
                onClick={() => handleDelete(val)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Registre des Dépenses</h2>
          <p className="text-muted-foreground mt-2 font-medium text-sm max-w-xl">Suivi immuable des décaissements. Toutes les pièces justificatives sont scellées sur Polygon.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-base transition-all hover:scale-[1.02] active:scale-95 shrink-0" onClick={() => setIsDrawerOpen(true)}>
          + Nouvelle Dépense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Dépenses Enregistrées" value={depenses.length} icon={<Receipt className="text-primary" />} />
        <StatsCard label="Total Décaissements" value={totalDepense} isCurrency icon={<ArrowDownRight className="text-rose-500" />} />
        <StatsCard label="Budget Consommé" value={`${consommation.toFixed(1)}%`} icon={<Wallet className="text-amber-500" />} />
      </div>

      <DataTable 
        title="Dépenses Enregistrées"
        columns={columns}
        data={depenses}
        loading={loading}
      />

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Ajouter une nouvelle dépense">
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-10 pt-6 pb-2">
            <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic">Nouvelle Dépense</DrawerTitle>
            <DrawerDescription className="text-muted-foreground font-medium italic mt-1">Saisissez les détails de la nouvelle dépense. Un justificatif IPFS sera requis pour la validation blockchain.</DrawerDescription>
          </DrawerHeader>

          <div className="px-10 py-6">
            <DepenseForm 
              onSuccess={() => {
                setIsDrawerOpen(false);
                refetch();
              }} 
              onCancel={() => setIsDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
