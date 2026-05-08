import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BlockchainProvider } from "@/components/providers/BlockchainProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KOMOE — Transparence Budgétaire sur Blockchain Polygon",
  description:
    "KOMOE rend chaque dépense communale ivoirienne immuable, publique et vérifiable sur la blockchain Polygon. Plateforme de transparence budgétaire pour les 201 communes de Côte d'Ivoire.",
  keywords: ["blockchain", "Polygon", "budget", "transparence", "Côte d'Ivoire", "communes", "KOMOE"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <BlockchainProvider>
            <AuthProvider>{children}</AuthProvider>
          </BlockchainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
