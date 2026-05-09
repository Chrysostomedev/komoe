"use client";

import DataTable, { ColumnConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { FormField, Input, RichTextEditor } from "@/components/ui/ReusableForm";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { signalementsApi, type Signalement } from "@/lib/api";

export default function SignalementsCommune() {
  const { user } = useAuth();
  const communeId = user?.commune ?? null;

  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignalements = useCallback(async () => {
    if (!communeId) return;
    setLoading(true);
    try {
      const res = await signalementsApi.list({ commune: communeId });
      setSignalements(res.results ?? []);
    } catch {
      setSignalements([]);
    } finally {
      setLoading(false);
    }
  }, [communeId]);

  useEffect(() => {
    fetchSignalements();
  }, [fetchSignalements]);

  const columns: ColumnConfig<Signalement>[] = [
    { header: 'ID', key: 'id', render: (val) => <span className="font-mono text-[10px] font-black uppercase text-muted-foreground">{String(val).slice(0, 8)}…</span> },
    {
      header: 'Signalement',
      key: 'sujet',
      render: (val, item) => (
        <div className="py-2">
          <div className="font-black text-foreground">{val as string}</div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
            <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Statut',
      key: 'is_reviewed',
      render: (val) => (
        <Badge variant={val ? 'success' : 'secondary'} className="rounded-lg px-3 py-1 font-black text-[10px]">
          {val ? 'TRAITÉ' : 'EN ATTENTE'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, item) => (
        <div className="flex items-center gap-2">
          {user?.role === 'MAIRE' && !item.is_reviewed && (
            <Button 
              onClick={() => handleProcess(item.id as string)}
              variant="outline" 
              size="sm" 
              className="rounded-xl font-black text-[10px] uppercase bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all h-8"
            >
              Marquer traité
            </Button>
          )}
          <Link href={`/commune/signalements/${item.id}`}>
            <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase hover:bg-muted h-8">
              Détails
            </Button>
          </Link>
        </div>
      )
    }
  ];

  const handleProcess = async (id: string) => {
    if (!confirm("Voulez-vous marquer ce signalement comme traité ?")) return;
    try {
      await signalementsApi.update(id, { is_reviewed: true });
      fetchSignalements();
    } catch (err: any) {
      alert("Erreur: " + (err?.message || "Échec"));
    }
  };



  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
             <MessageSquare className="text-primary" /> Signalements Citoyens
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
             Suivi participatif des incidents et requêtes de la population.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            <DataTable
              title="Flux des signalements"
              columns={columns}
              data={signalements}
              loading={loading}
            />
         </div>
         <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 p-6 rounded-[28px]">
               <h3 className="text-amber-800 dark:text-amber-500 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} /> En Attente
               </h3>
               <p className="text-4xl font-black text-amber-600">
                  {signalements.filter(s => !s.is_reviewed).length}
               </p>
               <p className="text-xs text-amber-700/60 mt-1 font-bold uppercase tracking-widest">signalements non traités</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 p-6 rounded-[28px]">
               <h3 className="text-emerald-800 dark:text-emerald-500 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Traités
               </h3>
               <p className="text-4xl font-black text-emerald-600">
                  {signalements.filter(s => s.is_reviewed).length}
               </p>
               <p className="text-xs text-emerald-700/60 mt-1 font-bold uppercase tracking-widest">signalements résolus</p>
            </div>
         </div>
      </div>
    </div>
  );
}
