"use client";

import { Card, CardContent } from "@/components/ui/Card";
import DataTable, { ColumnConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, Key, Loader2, CheckCircle2, UserMinus, AlertTriangle } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { FormField, Input, Select } from "@/components/ui/ReusableForm";
import { useState } from "react";
import { useUsersList } from "@/lib/hooks/useUsers";

export default function RolesCommune() {
  const { users: allUsers, loading, error, refetch } = useUsersList();
  
  // On filtre pour ne garder que le staff (Maire et Agents)
  const staff = allUsers.filter(u => u.role === 'MAIRE' || u.role === 'AGENT_FINANCIER');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const columns: ColumnConfig<any>[] = [
    { header: 'Agent / Fonction', key: 'nom', render: (_, item) => <span className="font-black text-foreground">{item.prenom} {item.nom}</span> },
    { 
      header: 'Adresse Wallet', 
      key: 'wallet_address', 
      render: (val) => (
        <span className="font-mono text-primary bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 text-[10px] font-black">
          {val || "Non configuré"}
        </span>
      ) 
    },
    {
      header: 'Rôle',
      key: 'role',
      render: (val) => (
        <Badge variant={val === 'MAIRE' ? 'destructive' : 'secondary'} className="rounded-lg px-3 py-1 font-black text-[10px]">
          {val.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'On-chain',
      key: 'is_blockchain_authorized',
      render: (val) => (
        <Badge variant={val ? 'success' : 'outline'} className="rounded-lg px-3 py-1 font-black text-[10px]">
          {val ? 'AUTORISÉ' : 'EN ATTENTE'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, item) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          onClick={() => setConfirmRevoke(item.id)}
        >
          <UserMinus size={16} />
        </Button>
      )
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      email: formData.get('email') as string,
      nom: (formData.get('nom_complet') as string).split(' ').slice(-1)[0] || 'Nom',
      prenom: (formData.get('nom_complet') as string).split(' ').slice(0, -1).join(' ') || 'Prénom',
      role: formData.get('role') as string,
      commune: allUsers[0]?.commune, // On l'affecte à la même commune que le staff actuel
      password: "KomoeStaffPassword2026!", // Mot de passe par défaut à changer
      password_confirm: "KomoeStaffPassword2026!"
    };

    setIsSubmitting(true);
    try {
      const { authApi } = await import('@/lib/api');
      await authApi.create(data);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsDrawerOpen(false);
        refetch();
      }, 2000);
    } catch (err: any) {
      alert("Erreur lors de la création : " + (err.message || "Email déjà utilisé ou données invalides"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) return;
    setIsSubmitting(true);
    try {
      const { authApi } = await import('@/lib/api');
      await authApi.delete(confirmRevoke);
      setConfirmRevoke(null);
      refetch();
    } catch (err: any) {
      alert("Erreur lors de la révocation : " + (err.message || "Permissions insuffisantes"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement des accès...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Gestion des Accès</h2>
          <p className="text-muted-foreground mt-2 font-medium">Contrôle des privilèges institutionnels au sein de la commune.</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-base transition-all hover:scale-105" 
          onClick={() => setIsDrawerOpen(true)}
        >
          <Key className="w-5 h-5 mr-3" />
          Ajouter un membre
        </Button>
      </div>

      <Card className="shadow-xl border-amber-200/50 bg-amber-50/20 dark:bg-amber-900/10 rounded-[32px] overflow-hidden">
        <CardContent className="p-8 flex items-start gap-6">
          <div className="p-4 bg-amber-400 text-white rounded-[24px] shadow-lg shadow-amber-400/20">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-amber-900 dark:text-amber-500 uppercase tracking-tight">Protocole de Sécurité</h3>
            <p className="text-sm font-bold text-amber-900/70 dark:text-amber-400/70 mt-2 leading-relaxed">
              Les accès de type <span className="text-amber-600 font-black">MAIRE</span> et <span className="text-amber-600 font-black">AGENT FINANCIER</span> sont liés à l'identité blockchain. Toute révocation est immédiate.
            </p>
          </div>
        </CardContent>
      </Card>

      <DataTable 
        title="Staff de la Commune"
        columns={columns}
        data={staff}
      />

      <Drawer isOpen={isDrawerOpen} onClose={() => !isSubmitting && setIsDrawerOpen(false)} title="Nouveau Membre Staff">
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-10 pt-6">
            <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic">Nouveau Membre Staff</DrawerTitle>
            <DrawerDescription className="text-muted-foreground font-medium italic mt-1">Attribuez des droits institutionnels à un nouvel agent ou membre de la mairie.</DrawerDescription>
          </DrawerHeader>

          <div className="px-10 py-6">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 border border-emerald-400/20">
                   <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Membre ajouté !</h3>
                <p className="text-muted-foreground font-medium italic mt-2 text-center max-w-[250px]">
                  L&apos;invitation a été envoyée. Le membre doit configurer son wallet pour l&apos;autorisation on-chain.
                </p>
              </div>
            ) : (
              <form className="space-y-8 pb-10" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Nom Complet" required>
                    <Input name="nom_complet" placeholder="Ex: Jean Kouadio" required disabled={isSubmitting} className="h-14 rounded-2xl border-border focus:ring-primary" />
                  </FormField>
                  
                  <FormField label="Email Institutionnel" required>
                    <Input name="email" type="email" placeholder="agent@commune.ci" required disabled={isSubmitting} className="h-14 rounded-2xl border-border focus:ring-primary" />
                  </FormField>
                </div>
    
                <FormField label="Rôle Institutionnel" required>
                  <Select name="role" required disabled={isSubmitting}>
                    <option value="AGENT_FINANCIER">Agent Financier (Saisie des flux)</option>
                  </Select>
                </FormField>
    
                <div className="pt-8 border-t border-border flex justify-end gap-4">
                  <Button variant="ghost" type="button" onClick={() => setIsDrawerOpen(false)} disabled={isSubmitting} className="font-bold rounded-xl h-14 px-8">Annuler</Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-white min-w-[240px] h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Key size={18} className="mr-2" />}
                    Créer le compte
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirmation de Révocation */}
      {confirmRevoke && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-[32px] shadow-2xl border-rose-200 animate-in zoom-in duration-300">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border-2 border-rose-100">
                 <AlertTriangle size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground">Révoquer l'accès ?</h3>
                <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                  Cette action supprimera immédiatement les droits de cet agent. Il ne pourra plus accéder aux outils de gestion communale.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={handleRevoke} className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-14 font-black">
                   Confirmer la révocation
                </Button>
                <Button variant="ghost" onClick={() => setConfirmRevoke(null)} className="rounded-2xl h-12 font-bold">
                   Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
