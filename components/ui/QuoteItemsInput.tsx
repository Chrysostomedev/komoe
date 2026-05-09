"use client";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

export interface QuoteItemData {
  designation: string;
  quantity: number;
  unit_price: number;
}

export const QuoteItemsInput = ({ name, defaultValue, onChange, disabled }: any) => {
  const [items, setItems] = useState<QuoteItemData[]>(() => {
    if (Array.isArray(defaultValue) && defaultValue.length > 0) {
      return defaultValue.map((i: any) => ({
        designation: i.designation || "",
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
      }));
    }
    return [{ designation: "", quantity: 1, unit_price: 0 }];
  });

  // Notifie le parent quand les items changent
  useEffect(() => {
    onChange?.(items);
  }, [items]);

  const updateItem = (index: number, field: keyof QuoteItemData, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as any;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { designation: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalHT = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const tva = totalHT * 0.18;
  const totalTTC = totalHT + tva;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="border border-border rounded-[24px] overflow-hidden bg-card shadow-sm">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-2 px-4 py-3 bg-muted border-b border-border">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Quantité</div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Prix U. HT</div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total HT</div>
          <div className="w-8"></div>
        </div>

        {/* Items */}
        <div className="divide-y divide-border">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-3 sm:gap-2 p-4 sm:p-2 sm:px-4 items-center group transition-colors hover:bg-muted/50">
              <input
                type="text"
                value={item.designation}
                onChange={e => updateItem(i, "designation", e.target.value)}
                disabled={disabled}
                placeholder="Ex: Main d'oeuvre"
                className="w-full bg-muted sm:bg-transparent border border-border sm:border-transparent rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all"
              />
              <input
                type="number"
                min="1"
                value={item.quantity || ""}
                onChange={e => updateItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 0))}
                disabled={disabled}
                placeholder="Qté"
                className="w-full bg-muted sm:bg-transparent border border-border sm:border-transparent rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground text-center focus:bg-card focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all"
              />
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price || ""}
                  onChange={e => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  placeholder="Prix"
                  className="w-full bg-muted sm:bg-transparent border border-border sm:border-transparent rounded-xl px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground text-right focus:bg-card focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">FCFA</span>
              </div>
              <div className="text-right text-sm font-bold text-foreground tabular-nums px-3 py-2">
                {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">FCFA</span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={disabled || items.length === 1}
                  onClick={() => removeItem(i)}
                  className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add button & Totals */}
        <div className="bg-muted border-t border-border p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <button
              type="button"
              disabled={disabled}
              onClick={addItem}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-brand-orange px-4 py-2.5 rounded-xl bg-card border border-border hover:border-brand-orange transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Plus size={14} strokeWidth={3} />
              Ajouter une ligne
            </button>

            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground font-medium">Total HT</span>
                <span className="font-bold text-foreground tabular-nums">{totalHT.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground font-medium">TVA (18%)</span>
                <span className="text-muted-foreground tabular-nums italic">calculé auto ({tva.toLocaleString()} FCFA)</span>
              </div>
              <div className="flex justify-between text-sm items-center pt-2 border-t border-border/60 mt-2">
                <span className="font-black text-foreground">Total TTC</span>
                <span className="font-black text-foreground tabular-nums">{totalTTC.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
