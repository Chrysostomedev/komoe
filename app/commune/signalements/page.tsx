"use client";

import DataTable, { ColumnConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FormField, Input, RichTextEditor } from "@/components/ui/ReusableForm";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { signalementsApi, type Signalement } from "@/lib/api";

export default function SignalementsCommune() {
  const { user } = useAuth();
  const communeId = user?.commune ?? null;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ sujet: "", description: "" });

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
      key: 'id',
      render: (val) => (
        <Link href={`/commune/signalements/${val}`}>
          <Button variant="outline" size="sm" className="rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all">
            Détails
          </Button>
        </Link>
      )
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communeId || !form.sujet.trim() || !form.description.trim()) return;
    setIsSubmitting(true);
    try {
      await signalementsApi.create({
        commune: communeId,
        sujet: form.sujet.trim(),
        description: form.description.trim(),
      });
      setShowSuccess(true);
      fetchSignalements();
      setTimeout(() => {
        setShowSuccess(false);
        setIsDrawerOpen(false);
        setForm({ sujet: "", description: "" });
      }, 2000);
    } catch (err: any) {
      alert("Erreur lors de l'envoi : " + (err?.message || "Échec"));
    } finally {
      setIsSubmitting(false);
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
        <Button 
          className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-base transition-all hover:scale-105" 
          onClick={() => setIsDrawerOpen(true)}
        >
          + Déclarer un incident
        </Button>
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

      <Drawer isOpen={isDrawerOpen} onClose={() => !isSubmitting && setIsDrawerOpen(false)} title="Nouveau Signalement">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
               <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-black text-foreground">Signalement Enregistré !</h3>
            <p className="text-muted-foreground text-sm mt-2 text-center max-w-[250px]">
              L'incident a été publié et sera visible par les services techniques.
            </p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormField label="Sujet du signalement" required>
              <Input
                placeholder="Ex: Lampadaire défectueux au carrefour..."
                required
                disabled={isSubmitting}
                value={form.sujet}
                onChange={(e: any) => setForm(f => ({ ...f, sujet: e.target.value }))}
              />
            </FormField>

            <FormField label="Description détaillée" required>
              <RichTextEditor
                name="description"
                placeholder="Décrivez le problème observé..."
                onChange={(val: string) => setForm(f => ({ ...f, description: val }))}
              />
            </FormField>

            <div className="pt-6 border-t border-border flex justify-end space-x-3">
              <Button variant="ghost" type="button" onClick={() => setIsDrawerOpen(false)} disabled={isSubmitting}>Annuler</Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20"
                disabled={isSubmitting || !form.sujet.trim() || !form.description.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Envoi...
                  </>
                ) : "Soumettre le signalement"}
              </Button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
