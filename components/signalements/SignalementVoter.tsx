"use client";

import { useState } from "react";
import { signalementsApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalementVoterProps {
  signalementId: string;
  initialNbVotes?: number;
  initialPct?: number;
}

export function SignalementVoter({ signalementId, initialNbVotes = 0, initialPct = 0 }: SignalementVoterProps) {
  const [loading, setLoading] = useState<"CREDIBLE" | "INFONDE" | null>(null);
  const [stats, setStats] = useState({ nbVotes: initialNbVotes, pct: initialPct });
  const [voted, setVoted] = useState(false);

  const handleVote = async (verdict: "CREDIBLE" | "INFONDE") => {
    setLoading(verdict);
    try {
      const res = await signalementsApi.voter(signalementId, verdict);
      setStats({ nbVotes: res.nb_votes, pct: res.pct_credible });
      setVoted(true);
    } catch (err) {
      console.error("Erreur vote:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Verdict communautaire
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-foreground bg-muted px-2 py-0.5 rounded-full">
            {stats.nbVotes} votes
          </span>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            stats.pct > 50 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
          )}>
            {stats.pct}% crédible
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          disabled={!!loading || voted}
          onClick={() => handleVote("CREDIBLE")}
          className={cn(
            "h-auto py-3 px-4 flex flex-col items-center gap-2 rounded-2xl transition-all",
            "hover:border-emerald-500/50 hover:bg-emerald-500/5",
            voted && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          {loading === "CREDIBLE" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">Crédible</span>
        </Button>

        <Button
          variant="outline"
          disabled={!!loading || voted}
          onClick={() => handleVote("INFONDE")}
          className={cn(
            "h-auto py-3 px-4 flex flex-col items-center gap-2 rounded-2xl transition-all",
            "hover:border-rose-500/50 hover:bg-rose-500/5",
            voted && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          {loading === "INFONDE" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">Infondé</span>
        </Button>
      </div>
      
      {voted && (
        <p className="text-center text-[9px] font-bold text-emerald-600 uppercase animate-pulse">
          Merci pour votre contribution citoyenne !
        </p>
      )}
    </div>
  );
}
