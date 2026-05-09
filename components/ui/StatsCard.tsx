"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
  isCurrency?: boolean;
  href?: string;
  shouldTruncate?: boolean;
  icon?: React.ReactNode;
}

function formatMontant(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace('.0', '')}K`;
  return `${Math.round(value)}`;
}

export default function StatsCard({ label, value, delta, trend = "up", isCurrency = false, href, shouldTruncate = true, icon }: StatsCardProps) {
  const isUp = trend === "up";
  const showFCFA = isCurrency || (typeof value === "string" && value.includes("FCFA"));

  let displayValue: string;
  if (typeof value === "number" && isCurrency) {
    displayValue = formatMontant(value);
  } else if (typeof value === "string" && value.includes("FCFA")) {
    displayValue = value.replace(" FCFA", "").trim();
  } else {
    displayValue = value.toString();
  }

  const inner = (
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground dark:text-muted-foreground text-xs font-bold uppercase tracking-wider">{label}</p>
        {icon && <div className="text-muted-foreground/80">{icon}</div>}
      </div>
      
      <div className="flex items-end gap-2">
        {showFCFA ? (
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{displayValue}</h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase ml-0.5">FCFA</span>
          </div>
        ) : (
          <h3 className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{displayValue}</h3>
        )}

        {delta && (
          <div className={cn("flex items-center gap-1 text-[10px] font-bold mb-1 ml-2 px-1.5 py-0.5 rounded-md", isUp ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400")}>
            {isUp ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
            <span>{delta}</span>
          </div>
        )}
      </div>
    </div>
  );

  const baseClasses = "relative overflow-hidden bg-card border border-border p-5 rounded-2xl shadow-sm transition-all duration-300 group";

  if (href) {
    return (
      <Link href={href} className="block">
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={cn(baseClasses, "cursor-pointer hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/50")}
        >
          {inner}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={baseClasses}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/5 dark:from-primary/20 dark:to-accent/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      {inner}
    </motion.div>
  );
}
