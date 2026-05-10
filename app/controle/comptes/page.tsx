"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, Search, ShieldCheck, Building2, Globe, Plus, Loader2, CheckCircle2, Mail, User, ShieldAlert, Key, ExternalLink } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/ReusableForm";
import { authApi, UserProfile, communesApi, Commune } from "@/lib/api";
import { polygonscanTxUrl, polygonscanAddressUrl, truncateHash } from "@/lib/constants";

const ROLE_LABELS: Record<string, string> = {
  DGDDL: "DGDDL",
  COUR_COMPTES: "Cour des Comptes",
  BAILLEUR: "Bailleur",
  MAIRE: "Maire",
  AGENT_FINANCIER: "Agent Financier",
  CITOYEN: "Citoyen",
  JOURNALISTE: "Journaliste",
};

const ROLE_COLORS: Record<string, "success" | "secondary" | "outline" | "destructive"> = {
  DGDDL: "success",
  COUR_COMPTES: "destructive",
  BAILLEUR: "secondary",
  MAIRE: "success",
  AGENT_FINANCIER: "secondary",
  CITOYEN: "outline",
  JOURNALISTE: "outline",
};

export default function ComptesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCommunes();
  }, []);

  const fetchCommunes = async () => {
    try {
      const res = await communesApi.list();
      const data = Array.isArray(res) ? res : (res as any).results || [];
      setCommunes(data);
    } catch (err) {
      console.error("Erreur communes:", err);
      setCommunes([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await authApi.list();
      setUsers(data?.results || []);
    } catch (err) {
      console.error("Erreur fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = (users || []).filter((u) => {
    const fullName = `${u.prenom} ${u.nom}`.toLowerCase();
    const matchSearch =
      fullName.includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "Tous" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles = ["Tous", ...Array.from(new Set((users || []).map((u) => u.role)))];

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data: any = Object.fromEntries(formData);
      if (!data.commune) delete data.commune;
      await authApi.create(data);
      setShowSuccess(true);
      fetchUsers();
      setTimeout(() => {
        setShowSuccess(false);
        setIsDrawerOpen(false);
      }, 2000);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthorizeBlockchain = async () => {
    if (!selectedUser || !walletAddress) return;
    setIsSubmitting(true);
    try {
      const res = await authApi.authorizeBlockchain(selectedUser.id, walletAddress);
      alert("Succès ! Rôle attribué sur Polygon Amoy. TX: " + res.tx_hash);
      setIsAuthModalOpen(false);
      setSelectedUser(null);
      setWalletAddress("");
      fetchUsers();
    } catch (err: any) {
      alert("Erreur Blockchain: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePause = async (action: "pause" | "unpause") => {
    if (!confirm(`Voulez-vous vraiment ${action === "pause" ? "suspendre" : "réactiver"} le contrat BudgetLedger ?`)) return;
    setIsPausing(true);
    try {
      const res = await authApi.togglePause(action);
      alert(`Contrat ${action}d ! TX: ` + res.tx_hash);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsPausing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <span className="font-black text-xs uppercase tracking-widest text-muted-foreground">Chargement des comptes sécurisés...</span>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Gestion des accès</h2>
          <p className="text-muted-foreground mt-1 font-medium italic">Annuaire centralisé des utilisateurs de la plateforme Komoe</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            variant="outline"
            onClick={() => handleTogglePause("pause")}
            disabled={isPausing}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-2xl h-14 px-6 font-black"
          >
            {isPausing ? <Loader2 className="animate-spin" /> : <ShieldAlert className="w-5 h-5 mr-2" />}
            Pause
          </Button>
          <Button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-base transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-3" />
            Nouveau compte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: "Total comptes", value: users.length, icon: Users, color: "text-foreground" },
          { label: "Mairies", value: users.filter(u => u.role === "MAIRE" || u.role === "AGENT_FINANCIER").length, icon: Building2, color: "text-primary" },
          { label: "Blockchain OK", value: users.filter(u => u.is_blockchain_authorized).length, icon: ShieldCheck, color: "text-emerald-500" },
          { label: "En ligne", value: users.filter(u => u.is_active).length, icon: Globe, color: "text-blue-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="rounded-[24px] border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-6 relative">
              <Icon className={`w-12 h-12 ${color} absolute -right-2 -bottom-2 opacity-5`} />
              <p className="text-3xl font-black text-foreground">{value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[32px] overflow-hidden border shadow-xl">
        <CardHeader className="bg-muted/30 border-b border-border p-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrer par nom, email..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-bold text-sm w-full md:w-64"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
            className="bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-xs font-black uppercase"
          >
            {roles.map((r) => (
              <option key={r} value={r}>{r === "Tous" ? "Tous les rôles" : ROLE_LABELS[r] ?? r}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Utilisateur</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rôle & Blockchain</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">Affectation</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">
                            {u.prenom[0]}{u.nom[0]}
                        </div>
                        <div>
                          <p className="font-black text-foreground group-hover:text-primary transition-colors">{u.prenom} {u.nom}</p>
                          <p className="text-[10px] text-muted-foreground italic">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge variant={ROLE_COLORS[u.role] ?? "outline"} className="rounded-lg w-fit px-3 py-0.5 text-[9px] font-black">
                          {ROLE_LABELS[u.role]?.toUpperCase() ?? u.role}
                        </Badge>
                        {u.is_blockchain_authorized ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600">
                            <ShieldCheck size={10} /> Sceau Blockchain Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black text-amber-500">
                            <ShieldAlert size={10} /> Non autorisé on-chain
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell font-bold text-xs">{u.commune_nom ?? "Côte d'Ivoire"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {["MAIRE", "AGENT_FINANCIER"].includes(u.role) && !u.is_blockchain_authorized && (
                          <Button
                            size="sm"
                            onClick={() => { setSelectedUser(u); setIsAuthModalOpen(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black h-8 rounded-lg"
                          >
                            <Key size={12} className="mr-1.5" /> Autoriser
                          </Button>
                        )}
                        {u.wallet_address && (
                          <a href={polygonscanAddressUrl(u.wallet_address)} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ExternalLink size={14} className="text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Drawer Création */}
      <Drawer isOpen={isDrawerOpen} onClose={() => !isSubmitting && setIsDrawerOpen(false)} title="Création de compte institutionnel">
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-10 pt-6">
            <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic">Création de Compte</DrawerTitle>
            <DrawerDescription className="text-muted-foreground font-medium italic mt-1">Créez un nouvel accès institutionnel. Le mot de passe devra être changé à la première connexion.</DrawerDescription>
          </DrawerHeader>

          <div className="px-10 py-6">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 border border-emerald-400/20">
                   <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Compte Créé !</h3>
                <p className="text-muted-foreground font-medium italic mt-2 text-center max-w-[250px]">
                  L&apos;utilisateur peut maintenant se connecter. N&apos;oubliez pas de l&apos;autoriser sur la blockchain s&apos;il s&apos;agit d&apos;un décideur.
                </p>
              </div>
            ) : (
              <form className="space-y-8 pb-10" onSubmit={handleCreateAccount}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Prénom" required>
                    <Input name="prenom" placeholder="Jean" required disabled={isSubmitting} className="h-14 rounded-2xl border-border focus:ring-primary" />
                  </FormField>
                  <FormField label="Nom" required>
                    <Input name="nom" placeholder="Kouadio" required disabled={isSubmitting} className="h-14 rounded-2xl border-border focus:ring-primary" />
                  </FormField>
                </div>
                
                <FormField label="Email professionnel" required>
                  <Input name="email" type="email" placeholder="nom@mairie.ci" required disabled={isSubmitting} className="h-14 rounded-2xl border-border focus:ring-primary" />
                </FormField>
    
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Rôle / Fonction" required>
                    <Select name="role" required disabled={isSubmitting}>
                      <option value="MAIRE">Maire</option>
                      <option value="AGENT_FINANCIER">Agent Financier</option>
                      <option value="DGDDL">DGDDL</option>
                      <option value="BAILLEUR">Bailleur</option>
                      <option value="COUR_COMPTES">Cour des Comptes</option>
                    </Select>
                  </FormField>
                  <FormField label="Commune d'affectation">
                    <Select name="commune" disabled={isSubmitting}>
                      <option value="">Nationale (Aucune)</option>
                      {(communes || []).map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>
    
                <FormField label="Mot de passe provisoire" required>
                  <Input name="password" type="password" required disabled={isSubmitting} className="h-14 rounded-2xl border-border focus:ring-primary" />
                </FormField>
    
                <div className="pt-8 border-t border-border flex justify-end gap-4">
                  <Button variant="ghost" type="button" onClick={() => setIsDrawerOpen(false)} disabled={isSubmitting} className="font-bold rounded-xl h-14 px-8">Annuler</Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-white min-w-[240px] h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : "Enregistrer le compte"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    
      {/* Modal Autorisation Blockchain */}
      <Drawer isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Autorisation Blockchain">
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-10 pt-6">
            <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic text-emerald-600">Autorisation Blockchain</DrawerTitle>
            <DrawerDescription className="text-muted-foreground font-medium italic mt-1">Attribuez des droits de signature cryptographique à ce compte institutionnel.</DrawerDescription>
          </DrawerHeader>

          <div className="px-10 py-6 space-y-8 pb-10">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex gap-4">
              <ShieldCheck className="text-emerald-600 w-8 h-8 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 mb-1">Avertissement Cryptographique</p>
                <p className="text-xs text-emerald-800 dark:text-emerald-500 font-medium leading-relaxed italic">
                  Cette action va inscrire l&apos;adresse wallet de l&apos;utilisateur dans le Smart Contract Komoe. 
                  Cela lui permettra de signer des transactions financières de manière immuable sur le réseau Polygon.
                </p>
              </div>
            </div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Utilisateur</p>
                <p className="text-lg font-black text-foreground">{selectedUser?.prenom} {selectedUser?.nom}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Rôle Blockchain</p>
                <p className="text-lg font-black text-primary">{selectedUser?.role === "MAIRE" ? "MAIRE_ROLE" : "AGENT_ROLE"}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Adresse Wallet Publique (0x...)</label>
              <Input 
                placeholder="Ex: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F" 
                value={walletAddress} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWalletAddress(e.target.value)}
                className="font-mono h-14 rounded-2xl border-border focus:ring-primary text-sm"
              />
            </div>
    
            <div className="pt-8 border-t border-border flex justify-end gap-4">
               <Button variant="ghost" onClick={() => setIsAuthModalOpen(false)} className="font-bold rounded-xl h-14 px-8">Annuler</Button>
               <Button 
                onClick={handleAuthorizeBlockchain} 
                disabled={isSubmitting || !walletAddress.startsWith("0x")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[240px] h-14 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
               >
                 {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmer l'inscription"}
               </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
