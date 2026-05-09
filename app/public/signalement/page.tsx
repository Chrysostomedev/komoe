"use client";

import { useState, useRef } from "react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { signalementsApi } from "@/lib/api";
import { transactionsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/ReusableForm";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldAlert, Send, CheckCircle2, AlertTriangle, Zap,
  Building2, MessageSquareText, Paperclip, X, FileImage, FileText as FilePdfIcon, Link2,
} from "lucide-react";

const CATEGORIES = [
  "Dépense suspecte",
  "Montant anormal",
  "Transaction sans justificatif",
  "Retard de publication",
  "Projet non réalisé",
  "Autre anomalie",
];

export default function SignalementPage() {
  const { communes } = useCommunesList();
  const [form, setForm] = useState({
    categorie: "",
    description: "",
    communeId: "",
    sujet: "",
    transactionId: "",
  });
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024); // max 10MB
    setFichiers(prev => [...prev, ...validFiles].slice(0, 5)); // max 5 fichiers
  };

  const handleRemoveFichier = (idx: number) => {
    setFichiers(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadFichierToIPFS = async (file: File): Promise<{ ipfs_hash: string; ipfs_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/ipfs", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Échec upload ${file.name}`);
    }
    const data = await res.json();
    // Le backend Next.js (/api/ipfs) retourne { ipfsHash: string }
    return {
      ipfs_hash: data.ipfsHash,
      ipfs_url: `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.communeId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Créer le signalement
      const signalement = await signalementsApi.create({
        commune: Number(form.communeId),
        sujet: form.sujet || form.categorie || "Anomalie",
        description: form.description,
        transaction: form.transactionId || null,
      });

      // 2. Upload chaque preuve sur IPFS puis lier au signalement
      if (fichiers.length > 0) {
        for (let i = 0; i < fichiers.length; i++) {
          const file = fichiers[i];
          setUploadProgress(`Upload preuve ${i + 1}/${fichiers.length} : ${file.name}`);
          const { ipfs_hash, ipfs_url } = await uploadFichierToIPFS(file);
          const type_fichier = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "autre";
          await signalementsApi.ajouterPreuve(signalement.id, {
            ipfs_hash,
            ipfs_url,
            nom_fichier: file.name,
            type_fichier,
          });
        }
      }

      setUploadProgress(null);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erreur lors de l'envoi du signalement.");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-black text-foreground tracking-tight uppercase italic text-center">Engagement enregistré</h3>
        <p className="text-muted-foreground mt-4 text-center max-w-md font-medium leading-relaxed">
          Votre signalement a été transmis en toute confidentialité aux autorités compétentes (DGDDL & Cour des Comptes).
          {fichiers.length > 0 && ` ${fichiers.length} preuve(s) archivée(s) sur IPFS.`}
          {" "}Votre vigilance contribue à une meilleure gestion du bien public.
        </p>
        <Badge className="mt-4 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 px-4 py-2 rounded-xl">
          +5 points de réputation citoyenne
        </Badge>
        <Button
          onClick={() => { setForm({ categorie: "", description: "", communeId: "", sujet: "", transactionId: "" }); setFichiers([]); setSubmitted(false); }}
          className="mt-8 h-14 px-10 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          Nouveau signalement
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-lg w-max mb-4 border border-amber-500/20">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Alerte Transparence</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
            <ShieldAlert className="text-amber-500" /> Signaler une anomalie
          </h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Participez à la surveillance citoyenne. Joignez des preuves photos ou documents pour renforcer votre alerte.
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-2 px-4 rounded-xl flex items-center gap-2">
          <Zap size={14} className="fill-primary" /> Sécurisé par KOMOE
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border">
            <CardHeader className="p-8 border-b border-border bg-muted/30">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground">Détails de l&apos;anomalie</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
              {uploadProgress && (
                <div className="mb-4 p-3 bg-primary/5 text-primary text-xs font-bold rounded-xl flex items-center gap-2 border border-primary/20">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  {uploadProgress}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Type d'anomalie" required>
                    <Select required value={form.categorie} onChange={(e: any) => setForm({ ...form, categorie: e.target.value })} disabled={loading}>
                      <option value="">Choisir...</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </FormField>

                  <FormField label="Collectivité concernée" required>
                    <div className="relative">
                      <Select required value={form.communeId} onChange={(e: any) => setForm({ ...form, communeId: e.target.value })} disabled={loading} className="pl-10">
                        <option value="">Sélectionner la commune...</option>
                        {communes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </Select>
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormField>
                </div>

                <FormField label="Sujet de votre alerte" required>
                  <Input required type="text" placeholder="Ex: Facturation suspecte d'un marché public" value={form.sujet} onChange={(e: any) => setForm({ ...form, sujet: e.target.value })} disabled={loading} />
                </FormField>

                {/* H2 : Cibler une transaction précise */}
                <FormField label="Transaction ciblée (optionnel)">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="UUID ou hash Polygon de la transaction concernée"
                      value={form.transactionId}
                      onChange={(e: any) => setForm({ ...form, transactionId: e.target.value })}
                      disabled={loading}
                      className="pl-10 font-mono text-xs"
                    />
                    <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Liez directement votre alerte à une dépense blockchain spécifique.</p>
                </FormField>

                <FormField label="Description détaillée" required>
                  <div className="relative">
                    <textarea
                      required
                      rows={5}
                      placeholder="Apportez le plus de précisions possible (lieux, dates, montants observés)..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      disabled={loading}
                      className="w-full bg-muted/50 border border-border rounded-2xl p-4 pl-10 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                    <MessageSquareText size={16} className="absolute left-3 top-4 text-muted-foreground" />
                  </div>
                </FormField>

                {/* H1 : Upload de preuves */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    Preuves photos / documents <span className="text-muted-foreground/60">(max 5 fichiers, 10MB chacun)</span>
                  </label>

                  {fichiers.length > 0 && (
                    <div className="space-y-2">
                      {fichiers.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                          {f.type.startsWith("image/") ? <FileImage size={16} className="text-primary" /> : <FilePdfIcon size={16} className="text-rose-500" />}
                          <span className="text-xs font-bold flex-1 truncate">{f.name}</span>
                          <span className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                          <button type="button" onClick={() => handleRemoveFichier(i)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {fichiers.length < 5 && (
                    <>
                      <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleAddFichier} />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={loading}
                        className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <Paperclip size={24} className="text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground">Cliquer pour joindre des preuves</span>
                        <span className="text-[10px] text-muted-foreground">JPG, PNG, PDF — archivées sur IPFS</span>
                      </button>
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                  {loading ? "Transmission en cours..." : "Soumettre le signalement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[32px] border-border shadow-xl bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-8">
              <h4 className="text-sm font-black uppercase text-amber-600 mb-4 flex items-center gap-2">
                <ShieldAlert size={16} /> Confidentialité Totale
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Votre identité n&apos;est jamais liée à ce signalement. KOMOE utilise des protocoles sécurisés pour garantir votre anonymat.
                Les preuves sont archivées sur IPFS de manière immuable et décentralisée.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border shadow-xl bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-8">
              <h4 className="text-sm font-black uppercase text-emerald-700 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} /> Réputation Citoyenne
              </h4>
              <div className="space-y-2">
                {[
                  { action: "Signalement soumis", pts: "+5 pts" },
                  { action: "Signalement avec preuve IPFS", pts: "+5 pts bonus" },
                  { action: "Signalement validé par DGDDL", pts: "+50 pts" },
                ].map((r) => (
                  <div key={r.action} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{r.action}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-0 text-[10px] font-black">{r.pts}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border shadow-xl">
            <CardContent className="p-8">
              <h4 className="text-sm font-black uppercase text-foreground mb-4">Processus d&apos;audit</h4>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                {[
                  { t: "Réception", d: "Enregistrement cryptographique + IPFS" },
                  { t: "Vérification", d: "Analyse des données blockchain" },
                  { t: "Action", d: "Audit officiel DGDDL" },
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black z-10 shrink-0">{i + 1}</div>
                    <div>
                      <p className="text-xs font-black text-foreground">{s.t}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
