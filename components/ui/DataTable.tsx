"use client";

import { useMemo, useState } from "react";
import SearchInput from "./SearchInput";

export type ColumnConfig<T> = {
  header: string;
  key: keyof T | "actions";
  render?: (value: any, item: T) => React.ReactNode;
};

type Props<T> = {
  title: string;
  columns: ColumnConfig<T>[];
  data: T[];
  onViewAll?: () => void;
  loading?: boolean;
};

/** Nettoie le HTML et rend une valeur de cellule cliquable si email/téléphone */
function renderCellValue(value: any): React.ReactNode {
  if (value == null || value === "") return "-";
  const str = String(value);

  // Détecte si c'est du HTML rich-text (contient des balises HTML)
  if (/<[a-z][\s\S]*>/i.test(str)) {
    const stripped = str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!stripped) return "-";
    // Rend le HTML formaté (gras, italique, etc.) dans une div prose compacte
    return (
      <div
        className="prose prose-sm max-w-none text-foreground line-clamp-2 text-xs leading-relaxed [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through"
        dangerouslySetInnerHTML={{ __html: str }}
      />
    );
  }

  const stripped = str.trim();
  if (!stripped) return "-";

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stripped)) {
    return (
      <a href={`mailto:${stripped}`} className="text-foreground hover:underline hover:text-foreground transition-colors" onClick={e => e.stopPropagation()}>
        {stripped}
      </a>
    );
  }
  // Téléphone
  if (/^[+\d][\d\s\-().]{6,}$/.test(stripped.trim())) {
    return (
      <a href={`tel:${stripped.replace(/\s/g, "")}`} className="text-foreground hover:underline hover:text-foreground transition-colors" onClick={e => e.stopPropagation()}>
        {stripped}
      </a>
    );
  }
  return stripped;
}

export default function DataTable<T extends { id: string | number }>({
  title,
  columns = [],
  data = [],
  onViewAll,
  loading = false,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const t = (key: string) => key === "table.search" ? "Rechercher..." : "Aucune donnée trouvée."; // Mock translation

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((item) =>
      Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="bg-card shadow-sm overflow-hidden rounded-3xl border border-border">
      <div className="flex items-center justify-between p-8 pb-4 gap-4">
        <h2 className="text-xl font-black text-foreground tracking-tight">{title}</h2>
        <div className="flex-1 flex justify-end">
          <SearchInput onSearch={setSearch} placeholder={t("table.search")} />
        </div>
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        <table className="min-w-full border-separate border-spacing-y-0">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80">
              {columns.map((col, index) => (
                <th
                  key={String(col.key)}
                  className={`py-4 px-4 text-left text-[13px] font-black text-foreground tracking-wider ${
                    index === 0 ? "rounded-l-2xl" : ""
                  } ${index === columns.length - 1 ? "rounded-r-2xl" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-muted-foreground text-sm italic">
                  Chargement des données...
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="group transition-colors hover:bg-muted/50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="py-5 px-4 text-sm font-bold text-muted-foreground">
                      {col.render
                        ? col.render(col.key !== "actions" ? item[col.key as keyof T] : undefined, item)
                        : col.key !== "actions"
                        ? renderCellValue(item[col.key as keyof T])
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-muted-foreground text-sm italic">
                  {t("table.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
