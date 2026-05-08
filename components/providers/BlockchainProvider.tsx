"use client";

import React from 'react';
import { 
  getDefaultConfig, 
  RainbowKitProvider, 
  darkTheme, 
  lightTheme 
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';
import { useAccount, useConnect } from 'wagmi';

// Création du client Query pour TanStack
const queryClient = new QueryClient();

// Configuration de Wagmi et RainbowKit
const config = getDefaultConfig({
  appName: 'KOMOE',
  projectId: '04309ed1007e15d0f65d1a869d8d475a',
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://rpc-amoy.polygon.technology"),
  },
  ssr: false,
});

function DebugPanel() {
  const { isConnected, isConnecting, address, status } = useAccount();
  const { connectors, connect, error } = useConnect();
  const [ethDetected, setEthDetected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setEthDetected(typeof window !== 'undefined' && !!(window as any).ethereum);
  }, []);

  const handleForceConnect = () => {
    const metamask = connectors.find(c => c.name.toLowerCase().includes('metamask') || c.id === 'injected');
    if (metamask) {
      console.log("🚀 Tentative de connexion forcée via:", metamask.name);
      connect({ connector: metamask });
    } else {
      alert("Connecteur MetaMask non trouvé parmi les 6 détectés.");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-black/95 border border-primary/50 rounded-2xl text-[10px] font-mono text-white max-w-xs shadow-2xl ring-2 ring-primary/20">
      <p className="font-bold border-b border-white/10 pb-2 mb-2 text-primary">DEBUG BLOCKCHAIN</p>
      <p>MetaMask détecté : <span className={ethDetected ? "text-emerald-400" : "text-red-400"}>{ethDetected ? "OUI" : "NON"}</span></p>
      <p>Statut Wagmi : <span className="text-amber-400">{status}</span></p>
      <p>Connecteurs : {connectors.length}</p>
      
      {!isConnected && (
        <button 
          onClick={handleForceConnect}
          className="mt-3 w-full bg-primary hover:bg-primary/80 text-white font-black p-3 rounded-xl transition-all shadow-lg animate-pulse"
        >
          🔥 FORCER CONNEXION METAMASK
        </button>
      )}

      {error && <p className="text-red-400 mt-2 bg-red-900/20 p-2 rounded">Erreur : {error.message}</p>}
      {address && (
        <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-emerald-400 font-bold">✅ CONNECTÉ</p>
          <p className="opacity-70">{address.slice(0, 10)}...</p>
        </div>
      )}
      
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 w-full bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors opacity-50"
      >
        RECHARGER LA PAGE
      </button>
    </div>
  );
}

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          <RainbowKitProvider
            modalSize="compact"
            theme={resolvedTheme === 'dark' ? darkTheme() : lightTheme()}
            locale="fr-FR"
          >
            {children}
            {process.env.NODE_ENV !== "production" && <DebugPanel />}
          </RainbowKitProvider>
        ) : (
          <div style={{ visibility: 'hidden' }}>{children}</div>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
