"use client";

import { useState } from "react";
import { useCommunesList, type Commune } from "@/lib/hooks/useCommunes";
import { communesApi } from "@/lib/api";
import { formatFCFA } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/ReusableForm";
import { Badge } from "@/components/ui/Badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { Globe, Banknote, Search, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

export default function DotationsPage() {
  const [search, setSearch] = useState("");
  const { communes, loading, error, refetch } = useCommunesList();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [newBudget, setNewBudget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = communes.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase()) || 
    c.region.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = communes.reduce((acc, c) => acc + c.budget_annuel_fcfa, 0);

  const handleOpenDrawer = (commune: Commune) => {
    setSelectedCommune(commune);
    setNewBudget(commune.budget_annuel_fcfa.toString());
    setIsDrawerOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommune) return;

    const parsedBudget = parseInt(newBudget.replace(/\s+/g, ""), 10);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      await communesApi.update(selectedCommune.id, { budget_annuel_fcfa: parsedBudget });
      alert(`Dotation de ${selectedCommune.nom} mise à jour avec succès.`);
      setIsDrawerOpen(false);
      await refetch();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la mise à jour de la dotation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && communes.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
            <Banknote className="w-8 h-8 text-primary" />
            Gestion des Dotations
          </h2>
          <p className="text-muted-foreground mt-2 font-medium italic">
            Allocation et supervision du budget annuel de chaque commune de Côte d'Ivoire.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Enveloppe Nationale</p>
          <p className="text-3xl font-black text-primary tabular-nums">{formatFCFA(totalBudget)}</p>
        </div>
      </div>

      <Card className="rounded-[32px] border-border shadow-xl bg-card/50 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une commune ou une région..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-sm font-bold border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 bg-card/50 transition-all shadow-inner"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[32px] overflow-hidden border border-border shadow-2xl bg-card/50 backdrop-blur-xl">
        <CardHeader className="bg-primary/5 border-b border-border p-6 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary italic">
            <Globe className="w-5 h-5" /> Registre d'Allocation
          </CardTitle>
          <Badge className="bg-primary/20 text-primary border-primary/20">{filtered.length} Communes</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <div key={c.id} className="p-6 hover:bg-muted/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-muted border border-border rounded-2xl flex items-center justify-center font-black text-xl text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                    {c.nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-lg text-foreground">{c.nom}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">{c.region} — Maire: {c.maire_nom || "Non assigné"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Budget 2026</p>
                    <p className="text-xl font-black text-foreground tabular-nums">
                      {formatFCFA(c.budget_annuel_fcfa)}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleOpenDrawer(c)}
                    className="rounded-xl font-black h-12 px-6 bg-background border-2 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-lg transition-all"
                  >
                    Gérer la Dotation
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-12 text-center text-muted-foreground font-bold uppercase tracking-widest">
                Aucune commune trouvée.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawer d'allocation */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <DrawerContent className="max-w-md mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl p-0 overflow-hidden">
          <DrawerHeader className="bg-primary/5 p-8 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Banknote size={24} />
              </div>
              <div>
                <DrawerTitle className="text-xl font-black uppercase tracking-tight italic text-primary">Allouer le Budget</DrawerTitle>
                <DrawerDescription className="text-muted-foreground font-medium italic mt-1">
                  Définissez la dotation pour {selectedCommune?.nom}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <form onSubmit={handleSaveBudget}>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Montant Alloué (FCFA)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">FCFA</span>
                  <input 
                    type="number"
                    required
                    min="0"
                    step="1"
                    className="w-full bg-muted/50 border border-border rounded-2xl pl-16 pr-4 py-4 text-xl font-black tabular-nums focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-inner"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 mt-4">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest italic leading-relaxed">
                    Ce montant servira de base pour le budget initial et le reste à réaliser de la commune.
                  </p>
                </div>
              </div>
            </div>
            <DrawerFooter className="p-6 bg-muted/30 border-t border-border flex-row gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)} className="flex-1 rounded-xl h-14 font-black">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-14 font-black shadow-xl shadow-primary/20 transition-all">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
