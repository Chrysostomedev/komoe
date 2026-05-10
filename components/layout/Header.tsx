"use client";

import { Role, ROLE_LABELS } from '@/types';
import { Bell, Wallet, Menu, Moon, Sun, ArrowLeft, CheckCircle2, Clock, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';

import { NotificationBell } from './NotificationBell';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/lib/auth-context';

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
  const { user } = useAuth();

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

          <NotificationBell />

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
              <div className="flex items-center justify-end gap-2">
                {user?.journaliste_verifie && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-md px-1.5 h-5 flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter">
                    <ShieldCheck size={10} /> Presse
                  </Badge>
                )}
                {user?.reputation_score !== undefined && (
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 rounded-md px-1.5 h-5 text-[9px] font-black uppercase tracking-tighter">
                    ⭐ {user.reputation_score}
                  </Badge>
                )}
                <p className="text-sm font-black text-foreground truncate max-w-[160px]">{info.title}</p>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{info.network}</span>
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
    </>
  );
};
