"use client";

import DataTable, { ColumnConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Users, UserCheck, MapPin, Activity, Loader2 } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { useUsersList } from "@/lib/hooks/useUsers";

export default function CitoyensCommune() {
  const { users: allUsers, loading, error } = useUsersList();
  
  // On filtre pour ne garder que les citoyens (le backend a déjà filtré par commune)
  const citoyens = allUsers.filter(u => u.role === 'CITOYEN');
  const verifies = citoyens.filter(u => u.reputation_score > 50).length; // Simulation de vérification via score

  const columns: ColumnConfig<any>[] = [
    { 
      header: 'Citoyen', 
      key: 'nom',
      render: (val, item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20">
            {item.avatar || item.nom.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-black text-foreground">{item.prenom} {item.nom}</div>
            <div className="text-[10px] text-muted-foreground font-bold truncate max-w-[150px]">{item.email}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Localisation', 
      key: 'commune_nom',
      render: (val) => (
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-muted-foreground" />
          <span className="text-sm font-medium">{val || "Non spécifié"}</span>
        </div>
      )
    },
    { 
      header: 'Téléphone', 
      key: 'telephone',
      render: (val) => <span className="text-xs font-mono font-bold text-muted-foreground">{val || "N/A"}</span>
    },
    {
      header: 'Statut KYC',
      key: 'journaliste_verifie',
      render: (_, item) => (
        <Badge variant={item.reputation_score > 50 ? 'success' : 'secondary'} className="rounded-full px-3 font-bold">
          {item.reputation_score > 50 ? 'VÉRIFIÉ' : 'EN ATTENTE'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, item) => (
        <Link href={`/commune/citoyens/${item.id}`}>
          <Button variant="ghost" size="sm" className="font-bold hover:text-primary rounded-xl">Consulter</Button>
        </Link>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement du registre citoyen...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Registre des Citoyens</h2>
          <p className="text-muted-foreground mt-2 font-medium text-sm italic">Consultation de l'identité des habitants de la commune inscrits via la plateforme publique.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Citoyens Inscrits" value={citoyens.length} icon={<Users className="text-primary" />} />
        <StatsCard label="Identités Vérifiées" value={verifies} icon={<UserCheck className="text-emerald-500" />} />
        <StatsCard label="Taux d'Engagement" value={citoyens.length > 0 ? `${Math.round((verifies / citoyens.length) * 100)}%` : "0%"} icon={<Activity className="text-blue-500" />} />
      </div>

      <DataTable 
        title="Base de données citoyenne (Lecture Seule)"
        columns={columns}
        data={citoyens}
      />
    </div>
  );
}
