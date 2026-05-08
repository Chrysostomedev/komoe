import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json({ error: "Pinata non configuré côté serveur." }, { status: 503 });
  }

  const formData = await req.formData();

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.error?.message || "Erreur upload IPFS" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({ ipfsHash: data.IpfsHash });
}
