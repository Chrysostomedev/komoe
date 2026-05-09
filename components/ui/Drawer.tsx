"use client";

import { X } from "lucide-react";
import { Button } from "./Button";
import { useEffect } from "react";

export function Drawer({ isOpen, onClose, title, children, description }: any) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl h-full bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight uppercase italic">{title}</h2>
            {description && <p className="text-xs text-muted-foreground font-medium mt-1 italic">{description}</p>}
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-full p-2 h-10 w-10 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </Button>
        </div>
        <div className="p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Sub-components for compatibility with shadcn-like usage
export const DrawerContent = ({ children }: any) => <div className="space-y-6">{children}</div>;
export const DrawerHeader = ({ children }: any) => <div className="mb-6">{children}</div>;
export const DrawerTitle = ({ children }: any) => <h2 className="text-2xl font-black uppercase italic text-foreground">{children}</h2>;
export const DrawerDescription = ({ children }: any) => <p className="text-sm text-muted-foreground font-medium mt-2">{children}</p>;
export const DrawerFooter = ({ children }: any) => <div className="mt-10 pt-6 border-t border-border flex justify-end gap-3">{children}</div>;
export const DrawerClose = ({ children, asChild, ...props }: any) => children; // Simple pass-through for now
