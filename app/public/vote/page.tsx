"use client";

import { useState, useEffect, useCallback } from "react";
import { propositionsApi, type Proposition } from "@/lib/api";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/ReusableForm";
import {
  ThumbsUp, ThumbsDown, Plus, Loader2, Users, TrendingUp,
  Building2, AlertTriangle, CheckCircle2, Clock, Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { formatFCFA, formatDateShort } from "@/lib/constants";

const STATUT_CONFIG = {
  ACTIVE: { label: "En vote", color: "bg-primary/10 text-primary border-primary/20" },
  VALIDEE: { label: "Validée ✓", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  REJETEE: { label: "Rejetée", color: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  EXPIREE: { label: "Expirée", color: "bg-muted text-muted-foreground border-border" },
  CONVERTIE: { label: "Convertie", color: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
} as const;

export default function VotePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { communes } = useCommunesList();
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCommune, setSelectedCommune] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ commune: "", titre: "", description: "", categorie: "INFRASTRUCTURE", budget: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchPropositions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propositionsApi.list({
        commune: selectedCommune ? Number(selectedCommune) : undefined,
        statut: "ACTIVE",
      });
      setPropositions(res.results ?? []);
    } catch {
      setPropositions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCommune]);

  useEffect(() => { fetchPropositions(); }, [fetchPropositions]);

  const handleVote = async (id: string, type_vote: "SOUTIEN" | "OPPOSITION") => {
    if (!user) { router.push("/login"); return; }
    setVotingId(id);
    try {
      const res = await propositionsApi.voter(id, type_vote);
      setPropositions(prev => prev.map(p =>
        p.id === id
          ? { ...p, nb_soutiens: res.nb_soutiens, nb_oppositions: res.nb_oppositions, pct_soutien: res.pct_soutien, mon_vote: type_vote, statut: res.statut as any }
          : p
      ));
    } catch (err: any) {
      alert(err?.message || "Erreur lors du vote");
    } finally {
      setVotingId(null);
    }
  };

  const handleRetirerVote = async (id: string) => {
    setVotingId(id);
    try {
      await propositionsApi.retirerVote(id);
      await fetchPropositions();
    } catch (err: any) {
      alert(err?.message || "Erreur");
    } finally {
      setVotingId(null);
    }
  };

  const handleSubmitProposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commune || !formData.titre || !formData.description) return;
    setSubmitting(true);
    try {
      await propositionsApi.create({
        commune: Number(formData.commune),
        titre: formData.titre,
        description: formData.description,
        categorie: formData.categorie,
        budget_demande_fcfa: Number(formData.budget) || 0,
      });
      setShowForm(false);
      setFormData({ commune: "", titre: "", description: "", categorie: "INFRASTRUCTURE", budget: "" });
      fetchPropositions();
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = propositions.filter(p =>
    p.titre.toLowerCase().includes(search.toLowerCase()) ||
    (p.commune_detail?.nom ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalVotes = propositions.reduce((s, p) => s + p.nb_soutiens + p.nb_oppositions, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-lg w-max mb-4 border border-primary/20">
            <Users size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Démocratie Participative</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Prioriser les Dépenses</h2>
          <p className="text-muted-foreground mt-2 font-medium max-w-xl">
            Votez pour les projets qui comptent pour votre commune. Une proposition soutenue par {">"}60% des votes est transmise directement au Maire.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-4 rounded-2xl border border-border text-center">
              <p className="text-2xl font-black text-primary">{propositions.length}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Propositions</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-2xl border border-border text-center">
              <p className="text-2xl font-black text-emerald-600">{totalVotes}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Votes exprimés</p>
            </div>
          </div>
          {user && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white rounded-xl h-12 px-6 font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus size={16} /> Soumettre une proposition
            </Button>
          )}
        </div>
      </div>

      {/* Formulaire de proposition */}
      {showForm && (
        <Card className="border-2 border-primary/20 rounded-[32px] shadow-xl">
          <CardHeader className="p-8 border-b border-border">
            <CardTitle className="font-black uppercase tracking-widest text-primary">Nouvelle Proposition de Dépense</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmitProposition} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Commune *</label>
                  <select required value={formData.commune} onChange={e => setFormData(p => ({ ...p, commune: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 h-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Choisir...</option>
                    {communes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catégorie *</label>
                  <select required value={formData.categorie} onChange={e => setFormData(p => ({ ...p, categorie: e.target.value }))}
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 h-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary">
                    {["INFRASTRUCTURE", "SANTE", "EDUCATION", "EAU_ASSAINISSEMENT", "SECURITE", "AGRICULTURE", "CULTURE_SPORT", "AUTRE"].map(c => (
                      <option key={c} value={c}>{c.replace("_", " & ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titre de la proposition *</label>
                <input required value={formData.titre} onChange={e => setFormData(p => ({ ...p, titre: e.target.value }))}
                  placeholder="Ex: Construction d'un dispensaire au quartier Nord"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description *</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Expliquez pourquoi ce projet est prioritaire pour la commune..."
                  className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Budget estimé (FCFA)</label>
                <input type="number" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))}
                  placeholder="Estimation du coût (facultatif)"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex justify-end gap-4 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl h-12 px-6 font-bold">Annuler</Button>
                <Button type="submit" disabled={submitting} className="bg-primary text-white rounded-xl h-12 px-8 font-black shadow-lg">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : "Soumettre (+10 pts)"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une proposition..."
            className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select value={selectedCommune} onChange={e => setSelectedCommune(e.target.value)}
          className="bg-card border border-border rounded-2xl px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[200px]">
          <option value="">Toutes les communes</option>
          {communes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {/* Liste des propositions */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">Aucune proposition active</p>
          {user && <Button onClick={() => setShowForm(true)} className="mt-6 bg-primary text-white rounded-xl px-6 h-10 font-bold text-xs">Soyez le premier à proposer</Button>}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((prop) => {
            const cfg = STATUT_CONFIG[prop.statut] ?? STATUT_CONFIG.ACTIVE;
            const totalV = prop.nb_soutiens + prop.nb_oppositions;
            const isVoting = votingId === prop.id;
            return (
              <Card key={prop.id} className="rounded-[28px] border border-border hover:shadow-xl transition-all group">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={`text-[10px] font-black px-3 py-1 rounded-lg border ${cfg.color}`}>{cfg.label}</Badge>
                        <Badge variant="outline" className="text-[10px] font-bold">{prop.categorie.replace("_", " & ")}</Badge>
                        {prop.commune_detail && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                            <Building2 size={12} /> {prop.commune_detail.nom}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{prop.titre}</h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{prop.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {prop.budget_demande_fcfa > 0 && (
                          <span className="font-bold text-foreground">{formatFCFA(prop.budget_demande_fcfa)}</span>
                        )}
                        <span><Clock size={12} className="inline mr-1" />{formatDateShort(prop.created_at)}</span>
                        <span><Users size={12} className="inline mr-1" />{totalV} vote{totalV !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Jauge de votes + boutons */}
                    <div className="lg:w-64 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-emerald-600">👍 {prop.nb_soutiens}</span>
                          <span className="text-rose-500">👎 {prop.nb_oppositions}</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: `${prop.pct_soutien}%` }}
                          />
                        </div>
                        <p className="text-center text-xs font-black text-muted-foreground">{prop.pct_soutien}% de soutien</p>
                        {prop.pct_soutien >= 60 && totalV >= 10 && (
                          <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-[10px] font-black bg-emerald-50 rounded-xl py-1.5">
                            <CheckCircle2 size={12} /> Seuil de validation atteint !
                          </div>
                        )}
                      </div>

                      {prop.statut === "ACTIVE" && (
                        <div className="space-y-2">
                          {prop.mon_vote ? (
                            <div className="space-y-2">
                              <div className={`text-center text-[10px] font-black py-2 rounded-xl ${prop.mon_vote === "SOUTIEN" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                Votre vote : {prop.mon_vote === "SOUTIEN" ? "👍 SOUTIEN" : "👎 OPPOSITION"}
                              </div>
                              <Button
                                variant="ghost"
                                onClick={() => handleRetirerVote(prop.id)}
                                disabled={isVoting}
                                className="w-full h-9 text-[10px] font-bold text-muted-foreground rounded-xl"
                              >
                                {isVoting ? <Loader2 size={12} className="animate-spin" /> : "Retirer mon vote"}
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => handleVote(prop.id, "SOUTIEN")}
                                disabled={isVoting || !user}
                                className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] flex items-center justify-center gap-1"
                              >
                                {isVoting ? <Loader2 size={12} className="animate-spin" /> : <><ThumbsUp size={14} /> Soutenir</>}
                              </Button>
                              <Button
                                onClick={() => handleVote(prop.id, "OPPOSITION")}
                                disabled={isVoting || !user}
                                variant="outline"
                                className="h-10 rounded-xl font-black text-[10px] text-rose-500 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1"
                              >
                                {isVoting ? <Loader2 size={12} className="animate-spin" /> : <><ThumbsDown size={14} /> S&apos;opposer</>}
                              </Button>
                            </div>
                          )}
                          {!user && (
                            <p className="text-[10px] text-center text-muted-foreground">
                              <button onClick={() => router.push("/login")} className="text-primary font-bold hover:underline">Connectez-vous</button> pour voter
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
