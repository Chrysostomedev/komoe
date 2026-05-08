"use client";

import { useState } from "react";
import { FormField, Input, Select, PdfUpload, RichTextEditor } from "@/components/ui/ReusableForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { transactionsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ipfsService } from "@/lib/ipfs";
import { useWriteContract, useAccount } from "wagmi";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";
import { Banknote, ShieldCheck } from "lucide-react";

export default function NouvelleRecettePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [files, setFiles] = useState<File[]>([]);
  
  const [form, setForm] = useState({
    montant_fcfa: "",
    categorie: "Subvention Etat",
    description: "",
    periode: new Date().toISOString().slice(0, 7),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.commune || user.role !== "MAIRE") { 
      setApiError("Accès refusé. Seul le Maire peut enregistrer une recette."); 
      return; 
    }

    if (!isConnected) {
      setApiError("Veuillez connecter votre portefeuille MetaMask (Maire).");
      return;
    }
    
    if (!form.description || form.description.length < 10) {
      setApiError("Veuillez fournir une description détaillée (min. 10 caractères).");
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const montantFinal = Number(form.montant_fcfa);
      if (montantFinal <= 0) {
        throw new Error("Le montant de la transaction doit être supérieur à 0.");
      }

      // 1. Upload Réel sur IPFS (Pinata)
      let realIpfsHash = undefined;
      if (files.length > 0) {
        try {
          realIpfsHash = await ipfsService.uploadFile(files[0]);
        } catch (err) {
          throw new Error("Échec de l'upload des justificatifs sur IPFS.");
        }
      }

      // 2. Création de la transaction en base Django (statut BROUILLON)
      const created = await transactionsApi.creerRecette({
        commune: user.commune,
        montant_fcfa: montantFinal,
        categorie: form.categorie,
        description: form.description,
        periode: form.periode,
        ipfs_hash: realIpfsHash,
      });

      // 3. Signature Blockchain avec le contrat enregistrerRecette (Seul MAIRE_ROLE autorisé)
      try {
        const txHash = await writeContractAsync({
          address: BUDGET_LEDGER_ADDRESS,
          abi: BUDGET_LEDGER_ABI,
          functionName: "enregistrerRecette",
          args: [
            created.id,
            String(created.commune),
            BigInt(created.montant_fcfa),
            created.categorie,
            realIpfsHash || "no-hash",
          ],
        });

        // 4. Confirmation du hash blockchain et passage au statut VALIDE
        await transactionsApi.confirmerRecette(created.id, txHash);
        alert("Succès ! La recette est officiellement enregistrée sur Polygon. 🚀");
        router.push("/commune/transactions");

      } catch (err: any) {
        console.warn("⚠️ Signature annulée ou échouée:", err);
        setApiError("Erreur Blockchain : " + (err.message || "Action annulée"));
      }
    } catch (err: any) {
      setApiError(err?.message || "Erreur lors de l'enregistrement de la recette.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
          <Banknote className="w-8 h-8 text-emerald-500" />
          Enregistrer une Recette
        </h2>
        <p className="text-muted-foreground mt-1 font-medium italic flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Action sécurisée et immuable réservée au Maire
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-2xl border-emerald-500/20 bg-card/40 backdrop-blur-xl rounded-[32px] overflow-hidden border">
          <CardContent className="p-8 space-y-8">
            
            <div className="space-y-6">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Détails de l'Encaissement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Montant perçu (FCFA)" required>
                  <Input 
                    type="number" 
                    placeholder="Ex: 50000000" 
                    value={form.montant_fcfa} 
                    onChange={(e: any) => setForm(f => ({ ...f, montant_fcfa: e.target.value }))}
                    className="font-black text-emerald-600 border-emerald-500/30 bg-emerald-500/5 focus:ring-emerald-500"
                  />
                </FormField>

                <FormField label="Source de la recette" required>
                  <Select required value={form.categorie} onChange={(e: any) => setForm(f => ({ ...f, categorie: e.target.value }))}>
                    <option value="Subvention Etat">Subvention de l'État</option>
                    <option value="Taxes Locales">Taxes Locales (Patente, Foncier...)</option>
                    <option value="Prestation Services">Prestation de Services Communaux</option>
                    <option value="Dotation">Dotation de fonctionnement</option>
                    <option value="Bailleur">Financement Bailleur (BM, FMI...)</option>
                    <option value="Don">Don et Legs</option>
                    <option value="Autre">Autre Source</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Période comptable" required>
                  <Input type="month" required value={form.periode} onChange={(e: any) => setForm(f => ({ ...f, periode: e.target.value }))} />
                </FormField>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-border/50">
              <h3 className="text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-6 bg-accent rounded-full"></span>
                Justificatifs & Documentation
              </h3>
              
              <FormField label="Description détaillée" required>
                <RichTextEditor 
                  name="description" 
                  placeholder="Expliquez la source des fonds et le cadre légal ou le projet concerné..." 
                  defaultValue={form.description}
                  onChange={(val: string) => setForm(f => ({ ...f, description: val }))} 
                />
              </FormField>

              <FormField label="Preuves Blockchain (Attestation de virement, Arrêté, etc.)">
                <PdfUpload 
                  name="documents" 
                  maxPDFs={1} 
                  placeholder="Glissez-déposez le document officiel ici" 
                  onChange={setFiles}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {apiError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-in zoom-in-95 duration-200">
            <p className="text-sm font-bold text-red-600 dark:text-red-400 text-center">{apiError}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => router.back()}
            className="font-bold text-muted-foreground hover:text-foreground h-14 px-8 rounded-2xl"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={loading} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ancrage Polygon...
              </span>
            ) : (
              "Enregistrer sur la Blockchain"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
