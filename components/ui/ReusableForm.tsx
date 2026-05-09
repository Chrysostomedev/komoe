"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Eye, EyeOff, Calendar,
  Bold, Italic, Underline, List, Strikethrough,
  Palette, Highlighter, AlignLeft, AlignCenter, AlignRight,
  CornerDownLeft, Plus, Minus, ImagePlus, X, Upload, FileText, ChevronDown,
  Image as ImageIcon, FileSpreadsheet, FileBox, FileArchive
} from "lucide-react";

type DateRange = any;

// Robust helper for date formatting in form fields
const format = (d: any, f: string) => {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

const DateRangePicker = ({ date, onDateChange, placeholder, className, singleDate }: any) => (
  <div className={`relative ${className}`}>
    <input 
      type={singleDate ? "date" : "text"} 
      value={date?.from ? (date.from instanceof Date ? date.from.toISOString().split('T')[0] : date.from) : ""}
      onChange={(e) => onDateChange({ from: new Date(e.target.value), to: new Date(e.target.value) })}
      placeholder={placeholder}
      className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-foreground outline-none focus:ring-2 focus:ring-primary transition-all" 
    />
    {!singleDate && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-black uppercase tracking-widest pointer-events-none">Période</span>}
  </div>
);

// Input Standard
export const FormField = ({ label, required, children }: any) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-sm font-bold text-foreground/90 tracking-tight">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// Input Texte
export const Input = (props: any) => (
  <input
    {...props}
    className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
  />
);

// Select (Style "Dropdown")
export const Select = ({ children, disabled, ...props }: any) => (
  <div className="relative">
    <select
      {...props}
      disabled={disabled}
      className={`w-full bg-muted/50 border border-border rounded-2xl p-4 text-foreground appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${disabled ? 'opacity-60 cursor-not-allowed bg-muted/20' : ''}`}
    >
      {children}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" strokeLinecap="round" /></svg>
    </div>
  </div>
);

// Champ Password
export const PasswordInput = ({ disabled, ...props }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        type={show ? "text" : "password"}
        className={`w-full bg-muted/50 border border-border rounded-2xl p-4 pr-12 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${disabled ? 'opacity-60 cursor-not-allowed bg-card/10' : ''}`}
      />
      {!disabled && (
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};


// Champ Checkbox
export const Checkbox = ({ name, label, required, defaultChecked, onChange, disabled }: any) => (
  <label className={`flex items-center gap-3 cursor-pointer group ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        name={name}
        required={required}
        disabled={disabled}
        defaultChecked={defaultChecked}
        className="peer appearance-none w-6 h-6 rounded-lg border-2 border-border checked:bg-primary checked:border-primary transition-all cursor-pointer disabled:cursor-not-allowed"
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <div className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
    </div>
    {label && <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>}
  </label>
);

// Champ Date
export const DateInput = ({ name, required, disabled, disablePastDates, defaultValue }: any) => {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (!defaultValue) return undefined;
    const d = new Date(defaultValue);
    return isNaN(d.getTime()) ? undefined : { from: d, to: d };
  });

  React.useEffect(() => {
    if (!defaultValue) { setRange(undefined); return; }
    const d = new Date(defaultValue);
    if (!isNaN(d.getTime())) setRange({ from: d, to: d });
  }, [defaultValue]);

  const value = range?.from ? format(range.from, "yyyy-MM-dd") : "";

  return (
    <div className="w-full">
      <DateRangePicker
        date={range}
        onDateChange={(r: any) => !disabled && setRange(r)}
        disablePastDates={disablePastDates ?? false}
        singleDate
        placeholder="Choisir une date"
        className="w-full"
      />
      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
};

// Champ Date Range
export const DateRangeInput = ({ name, required, disabled, disablePastDates, defaultValue }: any) => {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (!defaultValue) return undefined;
    if (typeof defaultValue === "object" && defaultValue.start_date) {
      const from = new Date(defaultValue.start_date);
      const to   = defaultValue.end_date ? new Date(defaultValue.end_date) : from;
      return { from, to };
    }
    return undefined;
  });

  return (
    <div className="w-full">
      <DateRangePicker
        date={range}
        onDateChange={(r: any) => !disabled && setRange(r)}
        disablePastDates={disablePastDates ?? false}
        placeholder="Sélectionner la période (début → fin)"
        className="w-full"
      />
      <input type="hidden" name="start_date" value={range?.from ? format(range.from, "yyyy-MM-dd") : ""} />
      <input type="hidden" name="end_date"   value={range?.to   ? format(range.to,   "yyyy-MM-dd") : (range?.from ? format(range.from, "yyyy-MM-dd") : "")} />
    </div>
  );
};

// ─── IMAGE UPLOAD ──────────────────────────────────────────────────────────────
interface ImageFile {
  id: string;
  file?: File;
  preview: string;
  isExisting?: boolean;
  name?: string;
}

const resolveUrl = (att: any) => att.url || "";
const useToast = () => ({ toast: { error: (msg: string) => alert(msg) } });

export const ImageUpload = ({
  name,
  maxImages = 3,
  maxSizeMB = 2,
  accept = "image/*",
  defaultValue,
  onChange,
  isLoading = false,
}: {
  name?: string;
  maxImages?: number;
  maxSizeMB?: number;
  accept?: string;
  defaultValue?: any;
  onChange?: (files: File[]) => void;
  isLoading?: boolean;
}) => {
  const { toast } = useToast();
  const [images, setImages] = useState<ImageFile[]>(() => {
    if (Array.isArray(defaultValue)) {
      return defaultValue.map((att: any) => ({
        id: att.id || Math.random().toString(36).slice(2),
        preview: resolveUrl(att),
        isExisting: true,
        name: att.name || "Image existante",
      }));
    }
    return [];
  });
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const newFiles = images.filter((img) => !img.isExisting && img.file).map((img) => img.file as File);
    onChange?.(newFiles);
  }, [images]);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const tooLargeFiles: string[] = [];

      fileArray.forEach(file => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          tooLargeFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (tooLargeFiles.length > 0) {
        toast.error(`Le fichier est trop volumineux, veuillez le réduire à ${maxSizeMB} Mo : ${tooLargeFiles.join(", ")}`);
      }

      if (validFiles.length === 0) return;

      const incoming = validFiles.slice(0, maxImages - images.length);
      const newImages: ImageFile[] = incoming.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }));
      setImages((prev) => [...prev, ...newImages].slice(0, maxImages));
    },
    [images.length, maxImages, maxSizeMB, toast]
  );

  const remove = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img && !img.isExisting) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const canAdd = images.length < maxImages;

  return (
    <div className="flex flex-col gap-3 w-full">
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); !isLoading && setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 w-full
            min-h-[140px] rounded-3xl cursor-pointer select-none
            transition-all duration-200
            ${dragging
              ? "bg-primary ring-2 ring-primary ring-offset-2"
              : "bg-muted/50 hover:bg-muted border-2 border-dashed border-border"
            }
            ${isLoading ? "opacity-60 cursor-wait bg-muted/20" : ""}
          `}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Envoi en cours...</p>
            </div>
          ) : (
            <>
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200
                ${dragging ? "bg-background/20" : "bg-background shadow-sm border border-border"}
              `}>
                <Upload
                  size={22}
                  className={dragging ? "text-primary-foreground" : "text-muted-foreground"}
                  strokeWidth={2}
                />
              </div>
              <div className="text-center px-4">
                <p className={`text-sm font-semibold transition-colors duration-200 ${dragging ? "text-primary-foreground" : "text-foreground"}`}>
                  {dragging ? "Déposez ici" : "Glissez vos images"}
                </p>
                <p className={`text-[11px] mt-0.5 transition-colors duration-200 ${dragging ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  ou cliquez pour parcourir · {images.length}/{maxImages} image{maxImages > 1 ? "s" : ""} · <span className="font-bold underline">Max {maxSizeMB}Mo</span>
                </p>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={maxImages > 1}
            className="hidden"
            disabled={isLoading}
            onChange={(e) => addFiles(e.target.files)}
            name={name}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {images.map((img, i) => (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden bg-card/10 aspect-square"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img
                src={img.preview}
                alt={img.name || img.file?.name || "Image"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/40 transition-all duration-200 rounded-2xl" />
              <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                <p className="text-[10px] font-semibold text-white truncate bg-primary/60 backdrop-blur-sm rounded-xl px-2 py-1">
                  {img.name || img.file?.name || "Image"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="
                  absolute top-2 right-2 w-7 h-7 rounded-xl
                  flex items-center justify-center
                  bg-card/90 hover:bg-card shadow-sm
                  opacity-0 group-hover:opacity-100
                  transition-all duration-150 active:scale-90
                "
              >
                <X size={14} strokeWidth={2.5} className="text-white/80" />
              </button>
              <div className="absolute top-2 left-2 w-5 h-5 rounded-lg bg-primary/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[9px] font-bold text-white">{i + 1}</span>
              </div>
            </div>
          ))}
          {canAdd && images.length > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="
                aspect-square rounded-2xl border-2 border-dashed border-white/10
                flex flex-col items-center justify-center gap-1.5
                hover:border-slate-400 hover:bg-card/5
                transition-all duration-200 active:scale-95
              "
            >
              <ImagePlus size={20} strokeWidth={2} className="text-white/40" />
              <span className="text-[10px] font-semibold text-white/40">Ajouter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── PHONE INPUT ──────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "CI", flag: "🇨🇮", dial: "+225", name: "Côte d'Ivoire" },
];

export interface PhoneInputProps {
  name: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

const ACTIVE_COUNTRIES = new Set(["CI"]);

export const PhoneInput = ({
  name,
  required,
  disabled,
  defaultValue = "",
  onChange,
}: PhoneInputProps) => {
  const parseDefault = (val: string) => {
    if (!val) return { country: COUNTRIES[0], number: "" };
    const matched = COUNTRIES.find(c => val.startsWith(c.dial));
    if (matched) return { country: matched, number: val.slice(matched.dial.length).trim() };
    return { country: COUNTRIES[0], number: val };
  };

  const parsed = parseDefault(defaultValue);
  const [selected, setSelected] = useState(parsed.country);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fullValue = `${selected.dial}${number}`;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s\-]/g, "");
    setNumber(val);
    onChange?.(`${selected.dial}${val}`);
  };

  const handleSelect = (country: typeof COUNTRIES[0]) => {
    if (!ACTIVE_COUNTRIES.has(country.code)) return;
    setSelected(country);
    setOpen(false);
    setSearch("");
    onChange?.(`${country.dial}${number}`);
  };

  return (
    <div className="space-y-1">
      <input type="hidden" name={name} value={fullValue} />
      <div className="flex items-stretch bg-muted/50 border border-border rounded-2xl overflow-visible relative" ref={dropRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-3.5 border-r border-border shrink-0 hover:bg-muted transition rounded-l-2xl ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="text-xl leading-none">{selected.flag}</span>
          <span className="text-xs font-bold text-muted-foreground tabular-nums">{selected.dial}</span>
          <ChevronDown size={12} className={`text-muted-foreground/60 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          disabled={disabled}
          required={required}
          placeholder="07 00 00 00 00"
          className={`flex-1 bg-transparent p-4 pl-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-0 text-sm font-medium ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  );
};

// ─── RICH TEXT EDITOR ─────────────────────────────────────────────────────────

export const RichTextEditor = ({ label, placeholder, name, defaultValue, onChange }: any) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (defaultValue ?? "")) {
      editorRef.current.innerHTML = defaultValue ?? "";
      if (hiddenRef.current) hiddenRef.current.value = defaultValue ?? "";
    }
  }, [defaultValue]);

  const applyStyle = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const raw = e.currentTarget.innerHTML;
    if (hiddenRef.current) hiddenRef.current.value = raw;
    onChange?.(raw);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="w-full bg-muted/50 rounded-3xl overflow-hidden border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted border-b border-border">
          <ToolbarButton icon={Bold} onClick={() => applyStyle("bold")} />
          <ToolbarButton icon={Italic} onClick={() => applyStyle("italic")} />
          <ToolbarButton icon={Underline} onClick={() => applyStyle("underline")} />
          <ToolbarButton icon={Strikethrough} onClick={() => applyStyle("strikeThrough")} />
          <div className="w-[1px] h-4 bg-border mx-1" />
          <ToolbarButton icon={AlignLeft} onClick={() => applyStyle("justifyLeft")} />
          <ToolbarButton icon={AlignCenter} onClick={() => applyStyle("justifyCenter")} />
          <ToolbarButton icon={AlignRight} onClick={() => applyStyle("justifyRight")} />
          <ToolbarButton icon={List} onClick={() => applyStyle("insertUnorderedList")} />
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full min-h-[180px] p-5 text-foreground outline-none bg-transparent prose prose-slate dark:prose-invert max-w-none leading-relaxed"
          onInput={handleInput}
        />
        <input type="hidden" name={name} ref={hiddenRef} />
      </div>
    </div>
  );
};

// ─── PDF UPLOAD ────────────────────────────────────────────────────────────────

interface PdfFile {
  id: string;
  file?: File;
  name: string;
  isExisting?: boolean;
}

export const PdfUpload = ({
  name,
  maxPDFs = 3,
  maxSizeMB = 2,
  defaultValue,
  onChange,
  accept = "application/pdf",
  placeholder,
  isLoading = false,
}: {
  name?: string;
  maxPDFs?: number;
  maxSizeMB?: number;
  defaultValue?: any;
  onChange?: (files: File[]) => void;
  accept?: string;
  placeholder?: string;
  isLoading?: boolean;
}) => {
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<PdfFile[]>(() => {
    if (Array.isArray(defaultValue)) {
       return defaultValue.map((att: any) => ({
         id: att.id || Math.random().toString(36).slice(2),
         name: att.name || "Document existant",
         isExisting: true
       }));
    }
    return [];
  });
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const newFiles = pdfs.filter(i => !i.isExisting && i.file).map(i => i.file as File);
    onChange?.(newFiles);
  }, [pdfs]);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const isMimeMatch = (type: string, name: string) => {
        if (!accept) return true;
        const types = accept.split(",").map(t => t.trim().toLowerCase());
        return types.some(t => {
          if (t.includes("*")) {
            const prefix = t.split("/")[0];
            return type.split("/")[0] === prefix;
          }
          return t === type.toLowerCase() || (t.startsWith(".") && name.toLowerCase().endsWith(t));
        });
      };

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const tooLargeFiles: string[] = [];

      fileArray.forEach(file => {
        if (!isMimeMatch(file.type, file.name)) return;
        if (file.size > maxSizeMB * 1024 * 1024) {
          tooLargeFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (tooLargeFiles.length > 0) {
        toast.error(`Le fichier est trop volumineux, veuillez le réduire à ${maxSizeMB} Mo : ${tooLargeFiles.join(", ")}`);
      }

      if (validFiles.length === 0) return;

      const incoming = validFiles.slice(0, maxPDFs - pdfs.length);
      const newPdfs: PdfFile[] = incoming.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        name: file.name
      }));
      setPdfs((prev) => [...prev, ...newPdfs].slice(0, maxPDFs));
    },
    [pdfs.length, maxPDFs, maxSizeMB, accept, toast]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const remove = (id: string) => {
    setPdfs((prev) => prev.filter((p) => p.id !== id));
  };

  const canAdd = pdfs.length < maxPDFs;

  return (
    <div className="flex flex-col gap-3 w-full">
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); !isLoading && setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 w-full
            min-h-[120px] rounded-3xl cursor-pointer select-none
            transition-all duration-200 border-2 border-dashed
            ${dragging
              ? "bg-primary border-primary ring-2 ring-primary ring-offset-2"
              : "bg-muted/50 border-border hover:bg-muted hover:border-muted-foreground/30"
            }
            ${isLoading ? "opacity-60 cursor-wait bg-muted/20" : ""}
          `}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Envoi en cours...</p>
            </div>
          ) : (
            <>
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200
                ${dragging ? "bg-background/20" : "bg-background shadow-sm border border-border"}
              `}>
                <Upload
                  size={22}
                  className={dragging ? "text-primary-foreground" : "text-muted-foreground"}
                  strokeWidth={2}
                />
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold transition-colors duration-200 ${dragging ? "text-primary-foreground" : "text-foreground"}`}>
                  {dragging ? "Déposez ici" : (placeholder || (accept.includes("image") ? "Cliquez pour uploader (Photos, PDF)" : "Cliquez pour uploader le PDF"))}
                </p>
                <p className={`text-[11px] mt-0.5 transition-colors duration-200 ${dragging ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {(accept.includes("image") || accept.includes("*")) ? "Images et documents acceptés" : (placeholder?.includes("PDF") || accept.includes("pdf") ? "Documents PDF uniquement" : "Documents acceptés")} · <span className="font-bold underline">Max {maxSizeMB}Mo</span>
                </p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={maxPDFs > 1}
            className="hidden"
            disabled={isLoading}
            onChange={(e) => addFiles(e.target.files)}
            name={name}
          />
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="space-y-2">
          {pdfs.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm animate-in fade-in slide-in-from-top-1"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                p.name.toLowerCase().endsWith(".pdf") ? "bg-red-500/10" :
                p.name.toLowerCase().match(/\.(doc|docx)$/) ? "bg-blue-500/10" :
                p.name.toLowerCase().match(/\.(xls|xlsx|csv)$/) ? "bg-emerald-500/10" :
                "bg-muted"
              }`}>
                {p.name.toLowerCase().endsWith(".pdf") ? <FileText size={20} className="text-red-500" /> :
                 p.name.toLowerCase().match(/\.(doc|docx)$/) ? <FileText size={20} className="text-blue-500" /> :
                 p.name.toLowerCase().match(/\.(xls|xlsx|csv)$/) ? <FileSpreadsheet size={20} className="text-emerald-500" /> :
                 p.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? <ImageIcon size={20} className="text-muted-foreground" /> :
                 <FileBox size={20} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black">
                  {p.name.toLowerCase().endsWith(".pdf") ? "Document PDF" :
                   p.name.toLowerCase().match(/\.(doc|docx)$/) ? "Document Word" :
                   p.name.toLowerCase().match(/\.(xls|xlsx|csv)$/) ? "Feuille de calcul" :
                   p.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? "Image" :
                   "Fichier"} chargé
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="p-2 hover:bg-muted rounded-xl transition text-muted-foreground hover:text-destructive"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── QUOTE ITEMS DYNAMIC INPUT ────────────────────────────────────────────────
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

  useEffect(() => {
    onChange?.(items);
  }, [items]);

  const updateItem = (index: number, field: keyof QuoteItemData, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value as never };
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
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-2 px-4 py-3 bg-muted/50 border-b border-border">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Quantité</div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Prix U. HT</div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total HT</div>
          <div className="w-8"></div>
        </div>
        <div className="divide-y divide-border">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1.5fr_1fr_auto] gap-3 sm:gap-2 p-4 sm:p-2 sm:px-4 items-center group transition-colors hover:bg-muted/30">
              <input
                type="text"
                value={item.designation}
                onChange={e => updateItem(i, "designation", e.target.value)}
                disabled={disabled}
                placeholder="Ex: Main d'oeuvre"
                className="w-full bg-muted/30 sm:bg-transparent border border-border sm:border-transparent rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <input
                type="number"
                min="1"
                value={item.quantity || ""}
                onChange={e => updateItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 0))}
                disabled={disabled}
                placeholder="Qté"
                className="w-full bg-muted/30 sm:bg-transparent border border-border sm:border-transparent rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground text-center focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                  className="w-full bg-muted/30 sm:bg-transparent border border-border sm:border-transparent rounded-xl px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground text-right focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tabular-nums"
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
                  className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 border-t border-border p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <button
              type="button"
              disabled={disabled}
              onClick={addItem}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl bg-background border border-border hover:border-muted-foreground/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
              <div className="flex justify-between text-sm items-center pt-2 border-t border-border mt-2">
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

const ToolbarButton = ({ icon: Icon, onClick, title }: any) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className="p-2 hover:bg-background rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-90"
  >
    <Icon size={18} strokeWidth={2.5} />
  </button>
);
