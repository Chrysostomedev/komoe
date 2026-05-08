"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@/types';
import {
  LayoutDashboard, Receipt, FileText, Building2,
  ShieldCheck, PieChart, AlertTriangle, Users, Shield,
  Network, ArrowDownRight, Clock, CheckCircle, Globe,
  BarChart3, Download, Eye, MapPin, X, ChevronLeft, ChevronRight, LogOut, Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';

interface SidebarProps {
  role: Role;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  onlyFor?: Role[];
  exact?: boolean;
}

const NAV_CONTROLE: NavItem[] = [
  { name: 'Vue nationale',           href: '/controle/dashboard',      icon: LayoutDashboard },
  { name: 'Gestion des accès',       href: '/controle/comptes',        icon: Users, onlyFor: ['DGDDL'] },
  { name: 'Les communes',            href: '/controle/communes',       icon: Globe },
  { name: 'Classement',              href: '/controle/classement',     icon: BarChart3 },
  { name: 'Alertes & retards',       href: '/controle/alertes',        icon: AlertTriangle },
  { name: 'Transactions',            href: '/controle/transactions',   icon: Receipt },
  { name: 'Preuves blockchain',      href: '/controle/preuves',        icon: ShieldCheck },
  { name: 'Réseau Polygon',          href: '/controle/blockchain',     icon: Network },
  { name: 'Rapports officiels',      href: '/controle/rapports',       icon: FileText },
  { name: 'Export / API',            href: '/controle/export',         icon: Download },
];

const NAV_COMMUNE: NavItem[] = [
  { name: 'Tableau de bord',         href: '/commune/dashboard',             icon: LayoutDashboard },
  { name: 'Saisir une dépense',      href: '/commune/transactions/nouvelle', icon: ArrowDownRight, onlyFor: ['AGENT_FINANCIER'] },
  { name: 'Enregistrer recette',     href: '/commune/recettes/nouvelle',     icon: Banknote,       onlyFor: ['MAIRE'] },
  { name: 'Mes saisies',             href: '/commune/transactions',          icon: Receipt,        onlyFor: ['AGENT_FINANCIER'], exact: true },
  { name: 'Dépenses',                href: '/commune/depenses',              icon: ArrowDownRight, onlyFor: ['AGENT_FINANCIER'] },
  { name: 'À valider',               href: '/commune/en-attente',            icon: Clock,          onlyFor: ['AGENT_FINANCIER'] },
  { name: 'Validation',              href: '/commune/validation',            icon: CheckCircle,    onlyFor: ['MAIRE'] },
  { name: 'Transactions',            href: '/commune/transactions',          icon: Receipt,        onlyFor: ['MAIRE'], exact: true },
  { name: 'Budget',                  href: '/commune/budget',                icon: PieChart },
  { name: 'Profil',                  href: '/commune/profil',                icon: Building2 },
  { name: 'Citoyens',                href: '/commune/citoyens',              icon: Users,          onlyFor: ['MAIRE'] },
  { name: 'Signalements',            href: '/commune/signalements',          icon: AlertTriangle,  onlyFor: ['MAIRE'] },
  { name: 'Rôles & Accès',           href: '/commune/roles',                 icon: Shield,         onlyFor: ['MAIRE'] },
  { name: 'Réseau Polygon',          href: '/commune/blockchain',            icon: Network },
];

const NAV_PUBLIC: NavItem[] = [
  { name: 'Tableau de bord',         href: '/public/dashboard',     icon: LayoutDashboard },
  { name: 'Budget temps réel',       href: '/public/budget',        icon: PieChart },
  { name: 'Transactions',            href: '/public/transactions',  icon: Receipt },
  { name: 'Scores',                  href: '/public/scores',        icon: BarChart3 },
  { name: 'Comparatif',              href: '/public/comparatif',    icon: Eye },
  { name: 'Communes',                href: '/public/communes',      icon: MapPin },
  { name: 'Réseau Polygon',          href: '/public/blockchain',    icon: Network },
  { name: 'Rapports & Audits',       href: '/public/rapports',      icon: FileText },
  { name: 'Export / API',            href: '/public/export',        icon: Download },
  { name: 'Signalement',             href: '/public/signalement',   icon: AlertTriangle },
  { name: 'Vérifier reçu',           href: '/public/verifier',      icon: ShieldCheck },
  { name: 'Projets financés',        href: '/public/projets',       icon: Building2,   onlyFor: ['BAILLEUR'] },
];

function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case 'DGDDL':
    case 'COUR_COMPTES':
      return NAV_CONTROLE.filter(item => !item.onlyFor || item.onlyFor.includes(role));
    case 'MAIRE':
    case 'AGENT_FINANCIER':
      return NAV_COMMUNE.filter(item => !item.onlyFor || item.onlyFor.includes(role));
    case 'BAILLEUR':
    case 'CITOYEN':
    case 'JOURNALISTE':
    default:
      return NAV_PUBLIC.filter(item => !item.onlyFor || item.onlyFor.includes(role));
  }
}

const ROLE_SHORT: Record<string, string> = {
  AGENT_FINANCIER: 'AGENT',
  MAIRE:           'MAIRE',
  DGDDL:           'DGDDL',
  COUR_COMPTES:    'AUDIT',
  BAILLEUR:        'BAILL.',
  CITOYEN:         'CITOYEN',
  JOURNALISTE:     'PRESSE',
};

export const Sidebar = ({ role, isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const navItems = getNavItems(role);
  console.log("SIDEBAR ROLE:", role, "ITEMS:", navItems.map(i => i.name));

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 dark:bg-black text-white border-r border-slate-800 transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-[80px]" : "w-[260px]"
        )}
      >
        {/* Header Logo Area */}
        <div className={cn(
          "h-16 flex items-center border-b border-border px-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">K</span>
              </div>
              <h1 className="text-lg font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">KOMOE</h1>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">K</span>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-card/10 text-white/60 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-card/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (!item.exact && pathname.startsWith(item.href + '/'));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group relative",
                  isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md font-semibold" 
                    : "text-white/60 hover:bg-white/10 hover:text-white font-medium"
                )}
              >
                <Icon className={cn(
                  "shrink-0 transition-colors duration-200",
                  isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3",
                  isActive ? "text-primary-foreground" : "text-white/60 group-hover:text-white"
                )} />
                
                {!isCollapsed && <span>{item.name}</span>}

                {/* Active indicator dot for collapsed mode */}
                {isActive && isCollapsed && (
                  <div className="absolute right-1 top-1 w-1.5 h-1.5 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" title="Polygon Amoy" />
              <Link href="/login" className="text-white/60 hover:text-white" title="Déconnexion">
                <LogOut size={20} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-white/60 font-medium tracking-wide uppercase">Polygon Amoy</span>
              </div>
              
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-card/5"
              >
                <LogOut size={16} />
                <span>Changer de profil</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
