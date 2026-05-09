"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DepenseForm } from "@/components/agent/DepenseForm";
import { useAuth } from "@/lib/auth-context";

export default function NouvelleTransaction() {
  const router = useRouter();
  const { user } = useAuth();

  if (user && user.role !== 'AGENT_FINANCIER') {
    // Redirection de sécurité frontend si un Maire ou autre tente d'accéder à cette route
    router.replace('/commune/dashboard');
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl h-full bg-background shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 border-l border-border">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">Nouvelle Saisie Budgétaire</h2>
              <p className="text-muted-foreground mt-2 font-medium text-sm">Enregistrez une nouvelle dépense de manière immuable sur la blockchain Polygon.</p>
            </div>
            <Button variant="ghost" onClick={() => router.back()} className="rounded-full p-2 h-10 w-10 hover:bg-muted">✕</Button>
          </div>

          <DepenseForm 
            onSuccess={() => router.push("/commune/transactions")}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
