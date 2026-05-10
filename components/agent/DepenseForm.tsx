"use client";

import { useState } from "react";
import { FormField, Input, Select, PdfUpload, RichTextEditor, QuoteItemsInput, QuoteItemData } from "@/components/ui/ReusableForm";
import { Button } from "@/components/ui/Button";
import { parseGwei } from "viem";
import { Card, CardContent } from "@/components/ui/Card";
import { transactionsApi, type ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ipfsService } from "@/lib/ipfs";
import { useWriteContract, useAccount } from "wagmi";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";

interface DepenseFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DepenseForm = ({ initialData, onSuccess, onCancel }: DepenseFormProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [files, setFiles] = useState<File[]>([]);
  
  const [form, setForm] = useState({
    type: initialData?.type || "DEPENSE",
    montant_fcfa: initialData?.montant_fcfa || "",
    categorie: initialData?.categorie || "Infrastructure",
    description: initialData?.description || "",
    periode: initialData?.periode || new Date().toISOString().slice(0, 7),
  });

  const totalHT = quoteItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const totalTTC = totalHT * 1.18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.commune) { 
      setApiError("Aucune commune associée à votre compte. Veuillez vous reconnecter."); 
      return; 
    }

    if (!isConnected) {
      setApiError("Veuillez connecter votre portefeuille MetaMask Agent.");
      return;
    }
    
    if (!form.description || form.description.length < 10) {
      setApiError("Veuillez fournir une description détaillée (min. 10 caractères).");
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const montantFinal = totalTTC > 0 ? totalTTC : Number(form.montant_fcfa);
      
      if (montantFinal <= 0) {
        throw new Error("Le montant de la transaction doit être supérieur à 0.");
      }

      // 1. Upload Réel sur IPFS (Pinata)
      let realIpfsHash = undefined;
      if (files.length > 0) {
        try {
          realIpfsHash = await ipfsService.uploadFile(files[0]);
        } catch (err) {
          throw new Error("Échec de l'upload des justificatifs sur IPFS. Vérifiez votre connexion.");
        }
      }

      // 2. Création ou Mise à jour de la transaction en base Django AVANT la signature
      let created;
      if (initialData?.id) {
        created = await transactionsApi.update(initialData.id, {
          type: form.type,
          montant_fcfa: montantFinal,
          categorie: form.categorie,
          description: form.description,
          periode: form.periode,
          ipfs_hash: realIpfsHash || initialData.ipfs_hash,
        });
      } else {
        created = await transactionsApi.soumettre({
          commune: user.commune,
          type: form.type,
          montant_fcfa: montantFinal,
          categorie: form.categorie,
          description: form.description,
          periode: form.periode,
          ipfs_hash: realIpfsHash,
        });
      }

      // 3. Signature Blockchain avec l'ID Django réel
      try {
        const txHash = await writeContractAsync({
          address: BUDGET_LEDGER_ADDRESS,
          abi: BUDGET_LEDGER_ABI,
          functionName: form.type === "RECETTE" ? "soumettreRecette" : "soumettreDepense",
          args: [
            created.id,
            String(created.commune),
            BigInt(created.montant_fcfa),
            created.categorie,
            realIpfsHash || "no-hash",
          ],
          // On force les frais à 30 Gwei pour éviter l'erreur "gas price below minimum" de Polygon Amoy
          maxPriorityFeePerGas: parseGwei('30'),
          maxFeePerGas: parseGwei('30'),
        });

        // 4. Patch du hash blockchain
        await transactionsApi.confirmerHash(created.id, txHash);
        alert("Succès ! La dépense est signée et envoyée au Maire. 🚀");
        onSuccess ? onSuccess() : router.push("/commune/transactions");

      } catch (err: any) {
        console.warn("⚠️ Signature annulée ou échouée:", err);
        // Si c'est une annulation MetaMask, on informe que c'est quand même en brouillon
        if (err.message?.includes("User rejected") || err.name === "UserRejectedRequestError") {
          alert("Signature annulée. La dépense est bien enregistrée en BROUILLON. Vous pourrez la signer plus tard.");
          onSuccess ? onSuccess() : router.push("/commune/transactions");
        } else {
          setApiError("Erreur Blockchain : " + (err.message || "Action annulée"));
        }
      }
    } catch (err: any) {
      setApiError(err?.message || "Erreur lors de l'enregistrement du brouillon.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <Card className="shadow-2xl border-border bg-card/40 backdrop-blur-xl rounded-[32px] overflow-hidden border">
        <CardContent className="p-8 space-y-8">
          
          <div className="space-y-6">
            <h3 className="text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-full"></span>
              Informations Générales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nature de l'opération" required>
                <Select required value={form.type} onChange={(e: any) => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="DEPENSE" className="bg-background text-foreground">Dépense (Décaissement)</option>
                  <option value="RECETTE" className="bg-background text-foreground">Recette (Encaissement)</option>
                </Select>
              </FormField>

              <FormField label="Montant (FCFA)" required={quoteItems.length === 0}>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="Ex: 1500000" 
                    value={quoteItems.length > 0 ? totalTTC.toFixed(0) : form.montant_fcfa} 
                    onChange={(e: any) => setForm(f => ({ ...f, montant_fcfa: e.target.value }))}
                    disabled={quoteItems.length > 0}
                    className={quoteItems.length > 0 ? "bg-primary/5 border-primary/20 text-primary font-black" : ""}
                  />
                  {quoteItems.length > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">Calculé via devis</span>
                    </div>
                  )}
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Domaine d'intervention (ODD)" required>
                <Select required value={form.categorie} onChange={(e: any) => setForm(f => ({ ...f, categorie: e.target.value }))}>
                  <option value="INFRASTRUCTURE" className="bg-background text-foreground">Infrastructures & Travaux (ODD 9)</option>
                  <option value="SANTE" className="bg-background text-foreground">Santé & Bien-être (ODD 3)</option>
                  <option value="EDUCATION" className="bg-background text-foreground">Éducation de qualité (ODD 4)</option>
                  <option value="EAU_ASSAINISSEMENT" className="bg-background text-foreground">Eau & Assainissement (ODD 6)</option>
                  <option value="ADMINISTRATION" className="bg-background text-foreground">Fonctionnement administratif</option>
                  <option value="AGRICULTURE" className="bg-background text-foreground">Agriculture & Souveraineté (ODD 2)</option>
                  <option value="CULTURE_SPORT" className="bg-background text-foreground">Culture & Sport</option>
                  <option value="AUTRE" className="bg-background text-foreground">Autres interventions</option>
                </Select>
              </FormField>

              <FormField label="Période comptable" required>
                <Input type="month" required value={form.periode} onChange={(e: any) => setForm(f => ({ ...f, periode: e.target.value }))} />
              </FormField>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-6 bg-accent rounded-full"></span>
              Détails & Justificatifs
            </h3>
            
            <FormField label="Description de la dépense" required>
              <RichTextEditor 
                name="description" 
                placeholder="Décrivez précisément l'objet de cette dépense, les bénéficiaires et l'impact attendu..." 
                defaultValue={form.description}
                onChange={(val: string) => setForm(f => ({ ...f, description: val }))} 
              />
            </FormField>

            <FormField label="Lignes de devis / Détails des articles">
               <QuoteItemsInput onChange={setQuoteItems} />
            </FormField>

            <FormField label="Preuves Blockchain (Factures, Devis, Bons en PDF)">
              <PdfUpload 
                name="documents" 
                maxPDFs={3} 
                placeholder="Glissez-déposez vos justificatifs scannés ici" 
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
          onClick={onCancel}
          className="font-bold text-muted-foreground hover:text-foreground h-14 px-8 rounded-2xl"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="bg-primary hover:bg-primary/90 text-white h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signature en cours...
            </span>
          ) : (
            "Soumettre sur la Blockchain"
          )}
        </Button>
      </div>
    </form>
  );
};
