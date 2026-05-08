"use client";

import { Role, ROLE_LABELS } from '@/types';
import { Bell, Wallet, Menu, Moon, Sun, ArrowLeft, CheckCircle2, Clock, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';

import { ConnectButton } from '@rainbow-me/rainbowkit';

interface HeaderProps {
  role: Role;
  onOpenMobile: () => void;
}

const ROLE_HEADER_INFO: Record<Role, { title: string; network: string }> = {
  AGENT_FINANCIER: { title: 'Agent Financier — Mairie',  network: 'Polygon Amoy' },
  MAIRE:           { title: 'Maire — Commune',            network: 'Polygon Amoy' },
  DGDDL:           { title: 'DGDDL — Ministère',   network: 'Polygon Amoy' },
  COUR_COMPTES:    { title: 'Cour des Comptes',  network: 'Polygon Amoy' },
  BAILLEUR:        { title: 'Banque Mondiale',        network: 'Polygon Amoy' },
  CITOYEN:         { title: 'Citoyen',                    network: 'Polygon Amoy' },
  JOURNALISTE:     { title: 'Presse / ONG',       network: 'Polygon Amoy' },
};

export const Header = ({ role, onOpenMobile }: HeaderProps) => {
  const info = ROLE_HEADER_INFO[role] ?? { title: 'Utilisateur', network: 'Polygon Amoy' };
  const { theme, setTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const notifications = [
    { 
      id: 1, 
      title: "Signature Requise", 
      desc: "Une nouvelle dépense (1.5M FCFA) attend votre validation Blockchain.", 
      time: "2h", 
      type: "warning", 
      icon: <Clock className="text-amber-500 w-5 h-5" /> 
    },
    { 
      id: 2, 
      title: "Transaction Confirmée", 
      desc: "La réfection du dispensaire a été gravée sur Polygon avec succès.", 
      time: "5h", 
      type: "success", 
      icon: <ShieldCheck className="text-emerald-500 w-5 h-5" /> 
    },
    { 
      id: 3, 
      title: "Transaction Rejetée", 
      desc: "Le Maire a rejeté la saisie 'Achat fournitures' pour motif: justificatif incomplet.", 
      time: "Hier", 
      type: "error", 
      icon: <XCircle className="text-rose-500 w-5 h-5" /> 
    },
    { 
      id: 4, 
      title: "Alerte de Sécurité", 
      desc: "Nouvelle connexion détectée sur votre compte signataire depuis Abidjan.", 
      time: "2j", 
      type: "info", 
      icon: <AlertCircle className="text-blue-500 w-5 h-5" /> 
    },
  ];

  return (
    <>
      <header className="h-16 flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden text-foreground" onClick={onOpenMobile}>
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-primary italic">
              KOMOE
            </span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span className="text-xs font-black text-muted-foreground tracking-widest uppercase">{ROLE_LABELS[role]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:bg-muted/50 rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Changer le thème</span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground relative hover:bg-muted/50 rounded-full group"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-background animate-pulse"></span>
          </Button>

          <Link href="/login" title="Retour à la connexion">
            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 border-border text-foreground hover:bg-muted font-bold rounded-xl h-9">
              <ArrowLeft className="w-4 h-4" />
              Quitter
            </Button>
            <Button variant="outline" size="icon" className="md:hidden border-border text-foreground hover:bg-muted rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-black text-foreground truncate max-w-[160px]">{info.title}</p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{info.network}</span>
              </div>
            </div>
            <ConnectButton 
              label="Connecter"
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
      </header>

      <Drawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} title="Centre de Notifications">
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className="p-5 bg-card border border-border rounded-[24px] shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 w-1 h-full ${
                n.type === 'error' ? 'bg-rose-500' : 
                n.type === 'warning' ? 'bg-amber-500' : 
                n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />
              
              <div className="flex gap-4 items-start">
                <div className={`p-2.5 rounded-2xl ${
                  n.type === 'error' ? 'bg-rose-50' : 
                  n.type === 'warning' ? 'bg-amber-50' : 
                  n.type === 'success' ? 'bg-emerald-50' : 'bg-blue-50'
                } bg-opacity-50`}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-foreground">{n.title}</p>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{n.time}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">
                    {n.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-0 hover:bg-transparent border-transparent bg-transparent">
                       Voir les détails →
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="ghost" className="w-full rounded-2xl text-xs font-black text-muted-foreground uppercase tracking-widest h-12">
            Marquer tout comme lu
          </Button>
        </div>
      </Drawer>
    </>
  );
};
