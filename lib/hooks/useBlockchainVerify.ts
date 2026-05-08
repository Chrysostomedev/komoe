"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://rpc-amoy.polygon.technology";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xae3ba377c763d6c622991408932e93430035b05f";

const ABI = [
  "function totalTransactions() view returns (uint256)",
  "function transactions(uint256) view returns (string, string, uint256, string, string, bool)"
];

export function useBlockchainVerify() {
  const [totalTransactions, setTotalTransactions] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTotal = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const total = await contract.totalTransactions();
      setTotalTransactions(Number(total));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erreur de lecture blockchain.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyTransaction = useCallback(async (hash: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const receipt = await provider.getTransactionReceipt(hash);
      if (receipt) {
        const block = await provider.getBlockNumber();
        return {
          blockNumber: receipt.blockNumber,
          confirmations: block - receipt.blockNumber + 1,
          status: receipt.status === 1 ? "Confirmé" : "Échoué",
        };
      }
      return {
        blockNumber: 0,
        confirmations: 0,
        status: "En attente",
      };
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erreur de vérification blockchain.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  return { totalTransactions, verifyTransaction, isLoading, error, refetch: fetchTotal };
}
