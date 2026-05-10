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
import { Globe, Banknote, Search, AlertTriangle, Loader2, ShieldCheck, Wallet, User } from "lucide-react";
import { useWriteContract, useAccount } from "wagmi";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";
import { parseGwei } from "viem";

export default function DotationsPage() {
  const [search, setSearch] = useState("");
  const { communes, loading, error, refetch } = useCommunesList();
  const { isConnected, address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
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

    if (!isConnected) {
      alert("Veuillez connecter votre portefeuille MetaMask (Admin DGDDL).");
      return;
    }

    const parsedBudget = parseInt(newBudget.replace(/\s+/g, ""), 10);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Mise à jour administrative (Backend)
      await communesApi.update(selectedCommune.id, { budget_annuel_fcfa: parsedBudget });

      // 2. Signature Blockchain (Preuve immuable)
      try {
        const txHash = await writeContractAsync({
          address: BUDGET_LEDGER_ADDRESS,
          abi: BUDGET_LEDGER_ABI,
          functionName: "enregistrerDotation",
          args: [
            String(selectedCommune.id),
            BigInt(parsedBudget)
          ],
          maxPriorityFeePerGas: parseGwei('40'),
          maxFeePerGas: parseGwei('40'),
        });

        // 3. Archivage du hash
        await communesApi.confirmerDotation(selectedCommune.id, txHash);
        alert(`Dotation signée sur la blockchain ! TX: ${txHash}`);
      } catch (err: any) {
        console.error("Signature annulée:", err);
        alert("Attention : Le budget est mis à jour en base, mais la signature blockchain a échoué ou a été annulée.");
      }

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

      <Card className="rounded-[32px] overflow-hidden border border-border/50 shadow-2xl bg-card/30 backdrop-blur-xl">
        <CardHeader className="bg-primary/5 border-b border-border/50 p-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
               <Globe className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight italic text-foreground">
                Registre National des Communes
              </CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit territorial — Côte d&apos;Ivoire</p>
            </div>
          </div>
          <Badge className="bg-primary text-white border-none px-4 py-1.5 rounded-full font-black text-xs shadow-lg shadow-primary/20">
            {filtered.length} Entités
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[700px] overflow-y-auto custom-scrollbar divide-y divide-border/30">
            {filtered.map((c) => (
              <div key={c.id} className="p-8 hover:bg-primary/[0.02] transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-muted border border-border/50 rounded-[22px] flex items-center justify-center font-black text-2xl text-primary shadow-sm group-hover:shadow-primary/10 group-hover:border-primary/30 transition-all">
                    {c.nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors tracking-tight">{c.nom}</h3>
                      {c.blockchain_tx_hash_dotation && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase px-2 rounded-lg flex items-center gap-1">
                          <ShieldCheck size={10} />
                          ✅ Dotation Signée
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="rounded-lg border-border/50 bg-muted/30 text-[9px] font-black uppercase px-2">
                        {c.region}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <User size={10} className="text-primary/60" /> {c.maire_nom || "Siège à pourvoir"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-12 w-full lg:w-auto justify-between lg:justify-end bg-muted/20 lg:bg-transparent p-4 lg:p-0 rounded-2xl border border-border/30 lg:border-none">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Allocation Budgétaire</p>
                    <p className="text-2xl font-black text-foreground tabular-nums tracking-tighter">
                      {formatFCFA(c.budget_annuel_fcfa)}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleOpenDrawer(c)}
                    className={`rounded-2xl font-black h-14 px-8 shadow-xl transition-all active:scale-95 ${
                      c.blockchain_tx_hash_dotation 
                      ? "bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20" 
                      : "bg-foreground text-background hover:bg-primary hover:text-white shadow-foreground/10 hover:shadow-primary/20"
                    }`}
                  >
                    <Banknote className="w-5 h-5 mr-2" />
                    {c.blockchain_tx_hash_dotation ? "Ajuster le budget" : "Doter"}
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <Search className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">
                  Aucune commune ne correspond à votre recherche.
                </p>
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
                <DrawerTitle className="text-xl font-black uppercase tracking-tight italic text-primary">
                  {selectedCommune?.blockchain_tx_hash_dotation ? "Ajuster la Dotation" : "Allouer le Budget"}
                </DrawerTitle>
                <DrawerDescription className="text-muted-foreground font-medium italic mt-1">
                  {selectedCommune?.blockchain_tx_hash_dotation 
                    ? `Modification du budget annuel pour ${selectedCommune?.nom}`
                    : `Définissez la dotation initiale pour ${selectedCommune?.nom}`
                  }
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
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : selectedCommune?.blockchain_tx_hash_dotation ? (
                  "Mettre à jour & Signer"
                ) : (
                  "Signer la Dotation"
                )}
              </Button>

            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
