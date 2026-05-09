"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Users, Building, Activity, Mail, Phone, Wallet, Shield, Edit3, Camera, Receipt, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCommuneDetail } from "@/lib/hooks/useCommunes";
import { Button } from "@/components/ui/Button";
import { useCommuneTransactions } from "@/lib/hooks/useTransactions";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/ReusableForm";
import { X, CheckCircle2, Loader2 as LoaderIcon, Loader2 } from "lucide-react";
import { ipfsService } from "@/lib/ipfs";
import { useRef } from "react";

export default function ProfilCommune() {
  const { user, refreshUser } = useAuth();
  const { commune } = useCommuneDetail(user?.commune ?? null);
  const { transactions } = useCommuneTransactions(user?.commune ?? null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const initials = `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`;
  const mesSaisies = transactions.filter(t => t.soumis_par_detail?.id === user.id);
  const totalGere = mesSaisies.reduce((s, t) => s + t.montant_fcfa, 0);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      telephone: formData.get('telephone') as string,
    };

    setIsSubmitting(true);
    try {
      const { authApi } = await import('@/lib/api');
      await authApi.updateMe(data);
      setShowSuccess(true);
      refreshUser(); // Refresh user context
      setTimeout(() => {
        setShowSuccess(false);
        setIsDrawerOpen(false);
      }, 2000);
    } catch (err: any) {
      alert("Erreur lors de la mise à jour : " + (err.message || "Données invalides"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const hash = await ipfsService.uploadFile(file);
      const url = ipfsService.getPublicUrl(hash);
      
      const { authApi } = await import('@/lib/api');
      await authApi.updateMe({ avatar: url });
      
      refreshUser();
      alert("Avatar mis à jour avec succès !");
    } catch (err: any) {
      alert("Erreur lors de l'upload de l'avatar : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Mon Profil Agent</h2>
          <p className="text-muted-foreground mt-1 font-medium text-sm italic">Gérez vos informations personnelles et visualisez vos statistiques.</p>
        </div>
        <Button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Edit3 size={18} /> Modifier le profil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* AGENT PROFILE CARD */}
        <Card className="lg:col-span-4 border-border shadow-2xl rounded-[32px] overflow-hidden bg-card/50 backdrop-blur-xl border relative">
          <div className="h-32 bg-gradient-to-br from-primary via-accent to-secondary opacity-20"></div>
          <CardContent className="px-8 pb-8 -mt-16 text-center">
            <div className="relative inline-block group">
              <div className="w-32 h-32 bg-primary text-white rounded-[40px] flex items-center justify-center font-black text-4xl border-8 border-background shadow-xl mb-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden relative">
                {isUploadingAvatar ? (
                  <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
                ) : initials}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-6 right-0 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-lg border border-border text-primary hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Camera size={16} />
              </button>
            </div>

            <h3 className="text-2xl font-black text-foreground tracking-tight">{user.full_name}</h3>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1 italic">Agent Financier</p>
            
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-7 italic">Commune de {commune?.nom || "Non assignée"}</Badge>
              <Badge variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20 h-7 flex items-center gap-1 italic">
                <Shield size={10} /> Compte Vérifié
              </Badge>
            </div>

            <div className="mt-8 space-y-4 text-left border-t border-border pt-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Mail size={14} /></div>
                <span className="font-bold truncate text-foreground/80">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Phone size={14} /></div>
                <span className="font-bold text-foreground/80">{user.telephone || "+225 00 00 00 00"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Wallet size={14} /></div>
                <span className="font-mono text-xs font-black text-primary truncate max-w-[180px]">{user.wallet_address || "Non liée"}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-4 rounded-2xl text-center border border-border/50">
                <p className="text-2xl font-black text-foreground tabular-nums">{mesSaisies.length}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider italic">Saisies</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-2xl text-center border border-border/50">
                <p className="text-2xl font-black text-foreground tabular-nums">
                  {mesSaisies.length > 0 
                    ? Math.round((mesSaisies.filter(t => t.statut === 'VALIDE').length / mesSaisies.length) * 100) 
                    : 100}%
                </p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider italic">Fiabilité</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COMMUNE INFO & STATS */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="border-border shadow-lg rounded-3xl overflow-hidden bg-card/50">
                <CardHeader className="bg-muted/30 border-b border-border">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 italic">
                    <Activity size={16} className="text-primary" /> Statistiques d'activité
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Receipt size={20} /></div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Budget Total Géré</p>
                          <p className="text-lg font-black text-foreground tabular-nums">{new Intl.NumberFormat('fr-CI').format(totalGere)} FCFA</p>
                        </div>
                     </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Clock size={20} /></div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">En attente signature</p>
                          <p className="text-lg font-black text-foreground tabular-nums">{mesSaisies.filter(t => t.statut === "SOUMIS").length} transactions</p>
                        </div>
                     </div>
                   </div>
                </CardContent>
             </Card>
  
             <Card className="border-border shadow-lg rounded-3xl overflow-hidden flex flex-col bg-card/50">
              <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 italic">
                  <MapPin size={16} className="text-primary" /> Localisation Commune
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative min-h-[180px]">
                <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/13/4011/3956.png')] bg-cover bg-center opacity-20 grayscale hover:grayscale-0 transition-all duration-700"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-card/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl border border-primary/10 text-center">
                    <p className="font-black text-primary text-xs uppercase tracking-widest italic">Mairie de {commune?.nom}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-lg rounded-[32px] overflow-hidden bg-card/50">
             <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-foreground flex items-center gap-3 uppercase tracking-tight italic">
                  <Building className="text-primary" /> Informations de la Commune
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Région / District</p>
                    <p className="text-lg font-bold text-foreground">{commune?.region || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Maire actuel</p>
                    <p className="text-lg font-bold text-foreground">{commune?.maire_nom || "Non défini"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Budget Primitif Annuel</p>
                    <p className="text-lg font-black text-primary tabular-nums">{new Intl.NumberFormat('fr-CI').format(commune?.budget_annuel_fcfa || 0)} FCFA</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Score Transparence</p>
                    <div className="flex items-center gap-3">
                       <p className="text-2xl font-black text-emerald-500 tabular-nums">{commune?.score_transparence}/100</p>
                       <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${commune?.score_transparence}%` }}></div>
                       </div>
                    </div>
                  </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Modifier le Profil">
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-8 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic">Modifier le Profil</DrawerTitle>
                <DrawerDescription className="text-muted-foreground font-medium italic mt-1">Mettez à jour vos informations de contact et d'identité.</DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted"><X className="w-5 h-5" /></Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {showSuccess ? (
            <div className="p-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-2xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Mise à jour réussie</h3>
              <p className="text-muted-foreground mt-2 font-medium italic">Vos informations ont été enregistrées avec succès.</p>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prénom</label>
                  <Input name="prenom" defaultValue={user.prenom} required className="h-14 rounded-2xl border-border bg-muted/30 focus:bg-card transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom</label>
                  <Input name="nom" defaultValue={user.nom} required className="h-14 rounded-2xl border-border bg-muted/30 focus:bg-card transition-all font-bold" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone</label>
                <Input name="telephone" defaultValue={user.telephone} placeholder="+225 07 00 00 00 00" required className="h-14 rounded-2xl border-border bg-muted/30 focus:bg-card transition-all font-bold" />
              </div>

              <div className="bg-primary/5 border border-primary/10 p-6 rounded-[24px] space-y-2">
                <p className="text-xs font-black text-primary uppercase tracking-widest">Note Sécurité</p>
                <p className="text-[11px] font-bold text-primary/70 leading-relaxed italic">
                  Certaines informations (Email, Commune, Wallet) sont liées à votre identité institutionnelle et ne peuvent être modifiées que par un administrateur DGDDL.
                </p>
              </div>

              <DrawerFooter className="px-0 pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-16 rounded-[20px] font-black text-lg shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
                >
                  {isSubmitting ? <LoaderIcon className="w-6 h-6 animate-spin mr-3" /> : "Enregistrer les modifications"}
                </Button>
              </DrawerFooter>
            </form>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
