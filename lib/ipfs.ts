/**
 * Service IPFS — passe par le proxy Next.js /api/ipfs pour protéger le JWT Pinata.
 * Le JWT ne doit jamais être exposé côté client (NEXT_PUBLIC_*).
 */

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

export const ipfsService = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
      name: `KOMOE_${Date.now()}_${file.name}`,
      keyvalues: { project: "KOMOE", type: "Justificatif Budget" },
    });
    formData.append("pinataMetadata", metadata);

    const response = await fetch("/api/ipfs", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || "Erreur lors de l'upload IPFS");
    }

    const data = await response.json();
    return data.ipfsHash as string;
  },

  getPublicUrl: (hash: string): string => {
    if (!hash) return "";
    return `https://${PINATA_GATEWAY}/ipfs/${hash}`;
  },
};
