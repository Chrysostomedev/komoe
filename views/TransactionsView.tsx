"use client";

import { Role } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExternalLink, FileText, Download, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import DataTable, { ColumnConfig } from '@/components/ui/DataTable';
import { useAuth } from '@/lib/auth-context';
import { useCommuneTransactions, useTransactionsList, STATUT_LABELS, STATUT_VARIANT } from '@/lib/hooks/useTransactions';
import { type Transaction } from '@/lib/api';
import { formatFCFA, formatDateShort, truncateHash, polygonscanTxUrl, stripHtml } from '@/lib/constants';

interface TransactionsViewProps {
  role: Role;
}

const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant={STATUT_VARIANT[status] ?? 'outline'}>
    {STATUT_LABELS[status] ?? status}
  </Badge>
);

const getDetailRoute = (role: Role, id: string) => {
  if (role === 'AGENT_FINANCIER' || role === 'MAIRE') return `/commune/transactions/${id}`;
  if (role === 'DGDDL' || role === 'COUR_COMPTES')   return `/controle/transactions/${id}`;
  return `/public/transactions/${id}`;
};

const exportCSV = (txs: Transaction[]) => {
  const header = 'ID,Type,Montant,Catégorie,Description,Statut,Date,Hash Polygon';
  const rows = txs.map(t =>
    [t.id, t.type, t.montant_fcfa, t.categorie, `"${t.description}"`, t.statut, t.created_at, t.blockchain_tx_hash_validation].join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'transactions_komoe.csv'; a.click();
  URL.revokeObjectURL(url);
};

export const TransactionsView = ({ role }: TransactionsViewProps) => {
  const { user } = useAuth();
  const communeId = user?.commune ?? null;

  const isCommune = role === 'AGENT_FINANCIER' || role === 'MAIRE';
  const { transactions: communeTxs, loading: lcLoading, error: lcError } = useCommuneTransactions(
    isCommune ? communeId : null
  );
  const { transactions: publicTxs, loading: lpLoading, error: lpError } = useTransactionsList(
    {}, !isCommune
  );

  const txs = isCommune ? communeTxs : publicTxs;
  const loading = isCommune ? lcLoading : lpLoading;
  const error = isCommune ? lcError : lpError;

  const columns: ColumnConfig<Transaction>[] = [
    {
      header: 'Type',
      key: 'type',
      render: (val) => (
        <Badge variant={val === 'DEPENSE' ? 'destructive' : 'success'}>
          {val === 'DEPENSE' ? '↓ Dépense' : '↑ Recette'}
        </Badge>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      render: (val, item) => {
        const cleanVal = typeof val === 'string' ? stripHtml(val.split("[REJET")[0].trim()) : val;
        return (
          <div>
            <div className="font-semibold text-foreground line-clamp-1">{cleanVal}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.categorie}</div>
          </div>
        );
      },
    },
    {
      header: 'Montant',
      key: 'montant_fcfa',
      render: (val, item) => (
        <span className={`font-bold tabular-nums ${item.type === 'DEPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
          {val > 0 ? formatFCFA(val) : '—'}
        </span>
      ),
    },
    {
      header: 'Date',
      key: 'created_at',
      render: (val) => <span className="text-muted-foreground text-sm">{formatDateShort(val)}</span>,
    },
    {
      header: 'Statut',
      key: 'statut',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: 'Décideur',
      key: 'valide_par_detail',
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-foreground">
            {item.valide_par_detail?.full_name || (item.statut === 'SOUMIS' ? '—' : 'Système')}
          </span>
          {item.statut === 'VALIDE' && <span className="text-[9px] font-black text-emerald-600 uppercase">Signataire</span>}
          {item.statut === 'REJETE' && <span className="text-[9px] font-black text-rose-600 uppercase">Auteur Rejet</span>}
        </div>
      ),
    },
    {
      header: 'Preuve Polygon',
      key: 'blockchain_tx_hash_validation',
      render: (val) =>
        val ? (
          <a
            href={polygonscanTxUrl(val)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded-lg hover:underline w-fit"
          >
            {truncateHash(val)}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: 'Actions',
      key: 'id',
      render: (val) => (
        <Link href={getDetailRoute(role, val)}>
          <Button variant="ghost" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Détails
          </Button>
        </Link>
      ),
    },
  ];

  if (role === 'COUR_COMPTES') {
    columns.splice(6, 0, {
      header: 'Justificatif IPFS',
      key: 'ipfs_hash',
      render: (val) =>
        val ? (
          <span className="text-xs font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
            {val.slice(0, 10)}…
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    });
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Registre des Transactions</h2>
          <p className="text-muted-foreground mt-1">
            Historique immuable gravé sur la blockchain{' '}
            <span className="text-purple-600 font-semibold">Polygon</span>.{' '}
            Chaque ligne est vérifiable sur{' '}
            <a href="https://amoy.polygonscan.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
              Polygonscan
            </a>.
          </p>
        </div>
        <div className="flex gap-3">
          {(role === 'DGDDL' || role === 'COUR_COMPTES' || role === 'JOURNALISTE' || role === 'AGENT_FINANCIER' || role === 'MAIRE') && (
            <Button variant="outline" size="sm" onClick={() => exportCSV(txs)} className="rounded-xl border-border font-bold">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          )}
          {role === 'AGENT_FINANCIER' && (
            <Link href="/commune/transactions/nouvelle">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-xl font-black px-6">
                + Nouvelle saisie
              </Button>
            </Link>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Chargement des transactions…</span>
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {!loading && !error && (
        <DataTable
          title={`Historique des flux — ${txs.length} entrée(s)`}
          columns={columns}
          data={txs}
        />
      )}
    </div>
  );
};
