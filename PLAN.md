# 🚀 KOMOE — MASTER PLAN DE DÉPLOIEMENT RÉEL
**Version** : 1.0 (Fullstack Blockchain Integration)
**Statut** : En cours de configuration

---

## 🏛️ 0 — ARCHITECTURE DES SERVICES & SYSTÈMES

| SERVICE | RÔLE TECHNIQUE | POURQUOI CE CHOIX ? |
| :--- | :--- | :--- |
| **Polygon (Amoy)** | Réseau Blockchain (L2) | Frais de gaz minimes, rapidité et sécurité héritée d'Ethereum. |
| **Alchemy** | Nœud RPC / API Web3 | Le "pont" stable pour connecter le code au réseau Polygon sans gérer de nœud. |
| **Pinata (IPFS)** | Stockage Décentralisé | Garantit l'immuabilité des justificatifs PDF (Audit Trail inviolable). |
| **MetaMask / Wagmi** | Signature Client (Web3) | Redonne le pouvoir de signature au Maire. Sécurité décentralisée (Self-Sovereignty). |
| **PostgreSQL** | Base de données Web2 | Indexation rapide pour l'affichage UI. La blockchain gère la preuve, Postgres le confort. |

---

## 🗺️ 1 — PHASAGE STRATÉGIQUE (ÉTAPE PAR ÉTAPE)

### 🟢 ÉTAPE 0 : MISE EN PLACE DE L'INFRASTRUCTURE
*Objectif : Obtenir tous les accès aux réseaux réels.*
- [x] **Alchemy** : Créer une App sur Polygon Amoy et récupérer l'URL RPC.
- [x] **Pinata** : Générer une clé API JWT pour le stockage IPFS.
- [x] **MetaMask** : Configurer un wallet de déploiement et obtenir des jetons POL sur le Faucet.

### 🔵 ÉTAPE 1 : DÉPLOIEMENT DU SMART CONTRACT
*Objectif : Rendre le code BudgetLedger.sol vivant sur la blockchain.*
- [x] **Compilation** : Lancer `npx hardhat compile` pour générer l'ABI.
- [x] **Déploiement** : Lancer le script sur Amoy.
- [x] **Sceau** : Noter l'adresse du contrat et mettre à jour `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### 🟡 ÉTAPE 2 : ACTIVATION DU BACKEND (PONT WEB2/WEB3)
*Objectif : Permettre à Django de communiquer avec le contrat.*
- [x] **Variables d'env** : Remplir `CONTRACT_ADDRESS` et `DEPLOYER_PRIVATE_KEY` dans le `.env` backend.
- [x] **Test d'Ancrage** : Vérifier que chaque validation en Mairie génère un vrai `tx_hash` Polygon.

### 🟠 ÉTAPE 3 : DÉCENTRALISATION (SIGNATURE CLIENT)
*Objectif : Faire signer le Maire avec son propre portefeuille.*
- [x] **Intégration Wagmi** : Ajouter le bouton "Connect Wallet" sur l'interface Mairie.
- [x] **Signature Navigateur** : Désactiver la signature serveur au profit de la signature via MetaMask pour les validations.

### 🔴 ÉTAPE 4 : INTÉGRITÉ DOCUMENTAIRE (FLUX IPFS)
*Objectif : Lier chaque dépense à un fichier immuable.*
- [x] **Upload Réel** : Remplacer le mock dans `DepenseForm.tsx` par l'appel API Pinata.
- [x] **Verification** : Permettre au citoyen de voir le justificatif sur le gateway IPFS depuis la page `/public/verifier`.

### 🟣 ÉTAPE 5 : PASSAGE EN PRODUCTION (MAINNET)
*Objectif : Lancement officiel pour les citoyens de Côte d'Ivoire.*
- [ ] **Migration Mainnet** : Remplacer Amoy par le réseau principal Polygon.
- [ ] **Audit de Sécurité** : Vérification finale des permissions RBAC.
- [ ] **Lancement** : Ouverture officielle de la plateforme au public.

---

## ⛓️ ACTIONS SPÉCIFIQUES BLOCKCHAIN

| ACTION | RESPONSABILITÉ | MÉTHODE |
| :--- | :--- | :--- |
| **Soumission** | Agent Financier | Enregistrement DB + Calcul CID IPFS. |
| **Validation** | Maire | **Signature Cryptographique** (MetaMask) -> Ancrage On-Chain. |
| **Vérification** | Public | Lecture directe du Smart Contract via RPC (Alchemy). |

---
**Plan validé par Antigravity.**
*Ce document sert de référence unique pour le développement technique.*




