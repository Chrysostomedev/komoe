"use client";

import { Search } from "lucide-react";

export default function SearchInput({ onSearch, placeholder }: any) {
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <input 
        type="search" 
        placeholder={placeholder || "Rechercher..."} 
        onChange={(e) => onSearch(e.target.value)} 
        className="w-full bg-muted border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary transition-all" 
      />
    </div>
  );
}
