# 🛡️ ANALYSE COMPLÈTE & EXHAUSTIVE — KOMOE
**Date** : 2026-05-08 — Audit chirurgical complet
**Expert** : Antigravity (Senior Fullstack Audit)
**Version** : Audit Final (Logique + Blockchain + Acteurs)

---

## 📊 TABLEAU 1 — LOGIQUE GÉNÉRALE : CE QUI EST FAIT / INCOMPLET / À AMÉLIORER

| # | DOMAINE | FICHIER / ROUTE | ÉTAT | CE QUI EST FAIT | CE QUI EST INCOMPLET / À AMÉLIORER | PRIORITÉ |
|---|---|---|---|---|---|---|
| 1 | **Authentification JWT** | [lib/auth-context.tsx](lib/auth-context.tsx) | ✅ FAIT | Login/refresh token, persistance Cookies + LocalStorage, RBAC fonctionnel | Aucune liaison entre `user.wallet_address` et MetaMask connecté côté front | 🟡 Moyenne |
| 2 | **Client API typé** | [lib/api.ts](lib/api.ts) | ✅ FAIT | Wrapper Fetch typé, gestion auto refresh token, types `Transaction`, `Signalement` | Pas d'endpoint `transactionsApi.valider()` qui propage le `tx_hash` client | 🔴 Haute |
| 3 | **Smart Contract BudgetLedger** | [contracts/contracts/BudgetLedger.sol](contracts/contracts/BudgetLedger.sol) | ✅ FAIT | AccessControl OZ, Pausable, 3 events indexés (Soumise/Validee/Recette), gestion rôles Agent/Maire | Pas de fonction `validerDepenseAvecMontantMax` (multisig) ; aucune limite de montant on-chain | 🟢 Faible (V2) |
| 4 | **Backend Web3.py Service** | [backend/apps/blockchain/service.py](backend/apps/blockchain/service.py) | ✅ FAIT | Méthodes `soumettre_depense`, `valider_depense`, `enregistrer_recette`, `attribuer_role_*`, `_send_transaction` | **BUG ligne 35** : `settings.POLYGON_RPC_URL` alors que `is_configured()` lit `POLYGON_AMOY_RPC_URL` (incohérence de variable) | 🔴 Haute |
| 5 | **Provider Wagmi/RainbowKit** | [components/providers/BlockchainProvider.tsx](components/providers/BlockchainProvider.tsx) | ✅ FAIT | Config polygonAmoy, RainbowKit FR, thème dynamique, DebugPanel forçage MetaMask | DebugPanel toujours visible en prod (à conditionner `NODE_ENV !== "production"`) | 🟡 Moyenne |
| 6 | **Saisie Dépense (Agent)** | [components/agent/DepenseForm.tsx](components/agent/DepenseForm.tsx) | ✅ FAIT | Upload IPFS Pinata réel, signature MetaMask `soumettreDepense`, envoi backend avec `tx_hash` | `tempId` régénéré côté front ≠ ID Django (le smart contract ne pourra pas matcher) ; pas de fallback si IPFS échoue | 🔴 Haute |
| 7 | **Validation Maire** | [app/commune/validation/page.tsx](app/commune/validation/page.tsx) | 🟡 INCOMPLET | Signature MetaMask via `validerDepense`, appel `transactionsApi.valider(tx.id)` | **Le `hash` retourné par MetaMask n'est PAS envoyé au backend** (ligne 60) → le backend re-signe via Web3.py = double signature/double gas | 🔴 Haute |
| 8 | **Rejet de transaction** | [app/commune/validation/page.tsx:72-81](app/commune/validation/page.tsx) | ❌ MOCK | UI Drawer avec motif | `handleRejeterSubmit` est un `console.log`, aucun appel API, aucune persistance | 🔴 Haute |
| 9 | **Vérification publique** | [app/public/verifier/page.tsx](app/public/verifier/page.tsx) | ✅ FAIT | Recherche par hash TX/IPFS/ID, lecture `getTransactionReceipt` via ethers, lien Polygonscan + Pinata | RPC URL hardcodée + clé API exposée ligne 6 ([useBlockchainVerify.ts:6](lib/hooks/useBlockchainVerify.ts#L6)) | 🔴 Haute (sécu) |
| 10 | **Service IPFS/Pinata** | [lib/ipfs.ts](lib/ipfs.ts) | 🟡 INCOMPLET | Upload via `pinFileToIPFS`, gateway public configurable | JWT exposé côté client via `NEXT_PUBLIC_PINATA_JWT` → fuite garantie. Doit passer par un proxy backend | 🔴 Haute (sécu) |
| 11 | **Backend Transactions Views** | [backend/apps/transactions/views.py](backend/apps/transactions/views.py) | 🟡 INCOMPLET | `TransactionListView` (public), `TransactionCreateView` (Agent), `valider_transaction` (Maire) | `valider_transaction` ne vérifie PAS l'authenticité du `tx_hash` reçu (n'importe qui pourrait fournir un hash bidon) | 🔴 Haute |
| 12 | **Serializer Transaction** | [backend/apps/transactions/serializers.py](backend/apps/transactions/serializers.py) | ✅ FAIT | Mapping catégories souple, validation montant > 0 | `SignalementSerializer` ligne 89 contient un artefact (`Meta = getattr(...)` inutile) | 🟢 Faible |
| 13 | **Dashboard Mairie** | [views/DashboardView.tsx](views/DashboardView.tsx) | ✅ FAIT | Agrégation via `useCommuneTransactions` | — | ✅ |
| 14 | **Budget Commune** | components/commune/BudgetCommune.tsx | ❌ MOCK | UI complète | Données hardcodées, aucune persistance DB, pas de modèle `BudgetAnnuel` côté Django | 🔴 Haute |
| 15 | **Citoyens Commune** | components/commune/CitoyensCommune.tsx | ❌ MOCK | UI liste | Tableau `citoyens` codé en dur, pas d'app `apps.citoyens` côté Django | 🟡 Moyenne |
| 16 | **Signalements (Mairie)** | components/commune/SignalementsCommune.tsx | ❌ MOCK | UI | Pas connecté à `signalementsApi` (alors que l'API existe et fonctionne côté public) | 🔴 Haute |
| 17 | **Signalement (Public)** | app/public/signalement/page.tsx | ✅ FAIT | `signalementsApi.create` réel | Pas de notification au Maire concerné | 🟡 Moyenne |
| 18 | **Scores publics** | app/public/scores/page.tsx | ✅ FAIT | Classement dynamique sur données réelles | — | ✅ |
| 19 | **Vue nationale (DGDDL)** | app/controle/dashboard | ✅ FAIT | `useTransactionsList` agrégation globale | — | ✅ |
| 20 | **Alertes (Contrôle)** | app/controle/alertes | ✅ FAIT | Filtre auto sur scores < 50 | Pas de comparaison DB vs Blockchain (audit on-chain) | 🟡 Moyenne |
| 21 | **Rapports PDF** | app/controle/rapports | 🟡 INCOMPLET | Stats budget/exécution réelles | Téléchargement PDF simulé (pas de génération réelle via jsPDF/Puppeteer) | 🟡 Moyenne |
| 22 | **Comptes Mairies (Admin)** | app/controle/comptes | ❌ MOCK | UI | `COMPTES_MOCK` codé en dur, pas de CRUD utilisateurs côté UI | 🔴 Haute |
| 23 | **Étape 5 — Mainnet** | PLAN.md | ❌ NON FAIT | — | Migration Polygon Mainnet, audit sécu RBAC final, ouverture publique | 🟢 V2 |
| 24 | **Multi-signature (Multisig)** | LOGIQUE.md §2.B | ❌ NON FAIT | Concept documenté | Smart contract ne supporte pas 3-sur-5 signatures pour grosses dépenses | 🟢 V2 |
| 25 | **Audit on-chain automatisé** | — | ❌ NON FAIT | — | Aucun cron/job qui compare events blockchain vs DB Django pour détecter altérations | 🟡 Moyenne |
| 26 | **Notifications blockchain** | — | ❌ NON FAIT | — | Pas d'écoute des events `DepenseValidee` pour notifier citoyens (push/email) | 🟢 V2 |

---

## ⛓️ TABLEAU 2 — LOGIQUE BLOCKCHAIN COMPLÈTE

| # | COMPOSANT BC | LIEU | RÔLE | ÉTAT | DÉTAIL TECHNIQUE | PROBLÈME / GAP |
|---|---|---|---|---|---|---|
| B1 | **Réseau** | Polygon Amoy (testnet) | L2 EVM-compatible, gas faible | ✅ | ChainId `80002`, RPC Alchemy `https://polygon-amoy.g.alchemy.com/v2/...` | Migration Mainnet pas commencée |
| B2 | **Wallet déploiement** | `0x5F6549e91D73eC4136e901F7C99972629d076a2c` | DGDDL admin / déployeur | ✅ | Détient `DEFAULT_ADMIN_ROLE` | Clé privée stockée dans `.env` backend → centralisé |
| B3 | **Contrat déployé (V1)** | `0xae3ba377c763d6c622991408932e93430035b05f` | Adresse utilisée par front [lib/blockchain.ts:37](lib/blockchain.ts#L37) | ✅ | ABI complète `BUDGET_LEDGER_ABI` | — |
| B4 | **Contrat déployé (V2)** | `0x3e11caf0c6f751a338a18dd6348f55a403823d54` | Mentionné dans PLANSTRUCTURE.md | 🟠 | Probable redéploiement | **2 adresses contrat = confusion** : laquelle est canonique ? |
| B5 | **Contrat dans `useBlockchainVerify`** | `0x83e2CD828d15A8D15f2178229F842D30CeD71228` | [lib/hooks/useBlockchainVerify.ts:7](lib/hooks/useBlockchainVerify.ts#L7) | ❌ | TROISIÈME adresse différente | **Incohérence critique** : 3 adresses différentes dans le projet |
| B6 | **ABI front** | [lib/blockchain.ts](lib/blockchain.ts) | Ts const | 🟡 | Seulement 3 fonctions exposées | Manque `attribuerRoleAgent/Maire`, `pause`, `revoquerRole`, `enregistrerRecette` |
| B7 | **ABI backend** | `lib/abi/BudgetLedger.json` | JSON complet | ✅ | Chargé par Web3.py | Vérifier que le JSON est synchronisé avec le `.sol` |
| B8 | **Rôle DEFAULT_ADMIN_ROLE** | DGDDL | Attribuer/révoquer rôles, pause | ✅ | `_grantRole` au constructeur | Pas de UI pour la DGDDL pour gérer les rôles |
| B9 | **Rôle AGENT_ROLE** | Agent Financier | `soumettreDepense` | 🟡 | Vérifié on-chain via `onlyRole(AGENT_ROLE)` | **Aucune UI Admin** pour attribuer ce rôle à un wallet d'agent réel |
| B10 | **Rôle MAIRE_ROLE** | Maire | `validerDepense`, `enregistrerRecette` | 🟡 | Vérifié via `onlyRole(MAIRE_ROLE)` | **Aucune UI Admin** pour attribuer ce rôle |
| B11 | **Event `DepenseSoumise`** | Smart Contract L40 | Indexé sur `depenseId`, `communeId`, `soumisePar` | ✅ | Émis par Agent | Pas d'indexer/listener TheGraph côté front |
| B12 | **Event `DepenseValidee`** | Smart Contract L60 | **Preuve publique immuable** | ✅ | Émis par Maire | Lecture front via `getTransactionReceipt` uniquement (pas via `getLogs`) |
| B13 | **Event `RecetteEnregistree`** | Smart Contract L80 | Recettes fiscales | 🟡 | Fonction backend existe (`enregistrer_recette`) | **Aucune UI** pour le Maire pour enregistrer une recette |
| B14 | **Pausable** | OZ Pausable | Pause d'urgence DGDDL | ✅ | `_pause`/`_unpause` | Aucune UI DGDDL pour déclencher la pause |
| B15 | **Soumission (Flux)** | DepenseForm.tsx | Agent signe via MetaMask, gas 30 Gwei forcé | 🟡 | `writeContractAsync` + envoi `tx_hash` au backend | `tempId` ≠ ID Django persisté (mismatch) |
| B16 | **Validation (Flux)** | ValidationPage.tsx | Maire signe via MetaMask | 🔴 | Hash récupéré mais **non transmis** à `transactionsApi.valider()` | Backend re-signe → double transaction blockchain (gaspillage gas + risque divergence) |
| B17 | **Vérification (Flux)** | VerifierPage.tsx | Public lit le receipt via Alchemy RPC | ✅ | `ethers.JsonRpcProvider.getTransactionReceipt` | Ne lit PAS le contenu de l'event (montant, IPFS) — juste le receipt |
| B18 | **IPFS Pinata** | lib/ipfs.ts | Upload PDF justificatif | 🟡 | API `pinFileToIPFS` fonctionnelle | **JWT exposé côté client** (`NEXT_PUBLIC_PINATA_JWT`) ⚠️ |
| B19 | **Hash IPFS** | Champ DB `Transaction.ipfs_hash` | Ancré dans event blockchain | ✅ | Inclus dans `args` de `validerDepense` | Pas de vérification que le CID est bien pinné avant signature |
| B20 | **Gestion gas** | DepenseForm.tsx L93-95 | `parseGwei('30')` priority, `parseGwei('35')` max | 🟡 | Hardcodé pour battre le filtre anti-spam Polygon Amoy | Pas adaptatif (utiliser estimation dynamique en prod) |
| B21 | **Backend `_send_transaction`** | service.py L54 | Build/sign/send/wait | ✅ | Gas hardcodé 300_000 | Pas de retry, timeout 120s sans gestion d'erreur granulaire |
| B22 | **Variable env RPC** | settings.py | `POLYGON_AMOY_RPC_URL` vs `POLYGON_RPC_URL` | 🔴 | **Bug** : `is_configured()` lit `POLYGON_AMOY_RPC_URL` mais `_get_w3()` utilise `POLYGON_RPC_URL` | Renommer pour cohérence |

---

## 👥 TABLEAU 3 — LOGIQUE + BLOCKCHAIN PAR ACTEUR (COMPLET)

### 🏛️ ACTEUR 1 — AGENT FINANCIER (Mairie)

| ÉLÉMENT | DÉTAIL | LOGIQUE WEB2 | LOGIQUE BLOCKCHAIN | ÉTAT |
|---|---|---|---|---|
| **Identité** | Compte Django `role=AGENT_FINANCIER` + Wallet MetaMask | JWT + `commune_id` | Adresse wallet → `AGENT_ROLE` on-chain | 🟡 Backend OK / Front pas de liaison wallet ↔ user |
| **Action 1 : Login** | Email/MDP | `POST /auth/login` → tokens | — | ✅ |
| **Action 2 : Connect Wallet** | RainbowKit modal | — | `useAccount()` Wagmi, vérification chain `polygonAmoy` | ✅ |
| **Action 3 : Saisir dépense** | Formulaire DepenseForm | Validation locale (montant > 0, description ≥ 10c) | — | ✅ |
| **Action 4 : Upload justificatif** | PDF drag&drop | `FormData` | `POST pinFileToIPFS` Pinata → CID retourné | 🟡 JWT côté client (faille) |
| **Action 5 : Signature soumission** | MetaMask popup | — | `writeContractAsync(soumettreDepense)` → emit `DepenseSoumise` | 🟡 `tempId` ≠ ID Django |
| **Action 6 : Persistance DB** | API Django | `POST /transactions/` avec `blockchain_tx_hash_soumission` | — | ✅ |
| **Action 7 : Voir ses soumissions** | Liste | `GET /transactions/commune/{id}/?statut=SOUMIS` | — | ✅ |
| **Restriction** | Ne peut PAS valider | Permission DRF `IsAgentFinancier` | `onlyRole(AGENT_ROLE)` ne peut appeler `validerDepense` | ✅ |
| **GAP** | — | — | Aucune UI pour qu'un wallet d'agent reçoive `AGENT_ROLE` automatiquement après création compte | 🔴 |

---

### 🏛️ ACTEUR 2 — MAIRE (Mairie)

| ÉLÉMENT | DÉTAIL | LOGIQUE WEB2 | LOGIQUE BLOCKCHAIN | ÉTAT |
|---|---|---|---|---|
| **Identité** | Compte Django `role=MAIRE` + Wallet MetaMask propre | JWT + `commune_id` | Adresse wallet → `MAIRE_ROLE` on-chain | 🟡 |
| **Action 1 : Login** | Email/MDP | `POST /auth/login` | — | ✅ |
| **Action 2 : Connect Wallet** | MetaMask | — | Wagmi `useAccount` | ✅ |
| **Action 3 : Voir file de validation** | Page `/commune/validation` | `useCommuneTransactions` filtre `SOUMIS` | — | ✅ |
| **Action 4 : Valider** | Bouton "Signer sur Polygon" | — | `writeContractAsync(validerDepense)` → emit `DepenseValidee` | 🔴 Hash non transmis backend |
| **Action 5 : Persistance** | — | `PATCH /transactions/{id}/valider/` | Backend re-signe (DOUBLON) | 🔴 Bug |
| **Action 6 : Rejeter** | Drawer avec motif | — | — | ❌ Mock (console.log) |
| **Action 7 : Enregistrer recette** | — | — | `enregistrerRecette` (smart contract OK) | ❌ Pas d'UI |
| **Action 8 : Tableau de bord** | Stats commune | `useCommuneTransactions` agrégé | — | ✅ |
| **Action 9 : Profil** | Infos commune + stats | API user/commune | — | ✅ |
| **Restriction** | Ne peut signer que pour SA commune | `transaction.commune == request.user.commune` | `MAIRE_ROLE` global (pas de scoping commune on-chain) | 🟡 Sécu Web2 OK, mais on-chain n'importe quel Maire peut valider n'importe quelle commune |
| **GAP** | Multisig 3-sur-5 pour > 50M FCFA | — | Smart contract ne supporte pas | 🟢 V2 |

---

### 🏛️ ACTEUR 3 — DGDDL / COUR DES COMPTES (Contrôle)

| ÉLÉMENT | DÉTAIL | LOGIQUE WEB2 | LOGIQUE BLOCKCHAIN | ÉTAT |
|---|---|---|---|---|
| **Identité** | Compte Django `role=DGDDL` ou `CONTROLE` + Wallet admin | JWT | Détient `DEFAULT_ADMIN_ROLE` | ✅ Backend / 🟡 Front |
| **Action 1 : Vue nationale** | Dashboard global | `useTransactionsList` toutes communes | — | ✅ |
| **Action 2 : Liste communes** | `/controle/communes` | `useCommunesList` | — | ✅ |
| **Action 3 : Alertes auto** | Score < 50 | Filtrage front | — | ✅ |
| **Action 4 : Export CSV** | Génération CSV | Fonction `Blob` côté client | — | ✅ |
| **Action 5 : Rapport PDF** | — | Téléchargement simulé | — | 🟡 Mock |
| **Action 6 : Gestion comptes** | CRUD users | — | — | ❌ `COMPTES_MOCK` |
| **Action 7 : Attribuer rôle Agent on-chain** | UI manquante | — | `attribuerRoleAgent(wallet)` | ❌ Pas d'UI (backend OK) |
| **Action 8 : Attribuer rôle Maire on-chain** | UI manquante | — | `attribuerRoleMaire(wallet)` | ❌ Pas d'UI |
| **Action 9 : Révoquer rôle** | UI manquante | — | `revoquerRole(role, wallet)` | ❌ Pas d'UI |
| **Action 10 : Pause urgence** | UI manquante | — | `pause()` / `unpause()` | ❌ Pas d'UI |
| **Action 11 : Audit on-chain** | Comparer events vs DB | — | Lecture `getLogs(DepenseValidee)` | ❌ Pas implémenté |
| **GAP MAJEUR** | Toute la console admin Web3 | — | — | 🔴 Critique pour gouvernance |

---

### 🏛️ ACTEUR 4 — CITOYEN / PUBLIC / PRESSE / BAILLEUR

| ÉLÉMENT | DÉTAIL | LOGIQUE WEB2 | LOGIQUE BLOCKCHAIN | ÉTAT |
|---|---|---|---|---|
| **Identité** | Aucune (anonyme) ou compte simple | Pas de JWT requis | Pas de wallet requis | ✅ |
| **Action 1 : Budget temps réel** | `/public/budget` | `useTransactionsList` filtré VALIDE | — | ✅ |
| **Action 2 : Vérifier reçu** | `/public/verifier` | Recherche par hash dans DB | `getTransactionReceipt` via Alchemy | ✅ |
| **Action 3 : Voir justificatif** | Lien Pinata | URL gateway | — | ✅ |
| **Action 4 : Voir TX Polygonscan** | Lien externe | URL `amoy.polygonscan.com/tx/0x...` | Lecture publique | ✅ |
| **Action 5 : Signaler anomalie** | `/public/signalement` | `POST /signalements/` | — | ✅ |
| **Action 6 : Scores communes** | Classement | Calcul dynamique | — | ✅ |
| **Action 7 : Notifications** | — | — | Listener events on-chain | ❌ Pas implémenté |
| **GAP** | Vérification de signature autonome | — | Lire les events directement (pas via DB Django) | 🟡 Améliorable |

---

## 🔴 BUGS / INCOHÉRENCES CRITIQUES IDENTIFIÉS

| # | BUG | LIEU | IMPACT |
|---|---|---|---|
| C1 | **3 adresses de contrat différentes** dans le code | `lib/blockchain.ts` (ae3b...), `lib/hooks/useBlockchainVerify.ts` (83e2...), `PLANSTRUCTURE.md` (3e11...) | Lecture/écriture sur des contrats différents → données fantômes |
| C2 | **Variable RPC incohérente backend** | `service.py` mélange `POLYGON_RPC_URL` et `POLYGON_AMOY_RPC_URL` | Connexion peut échouer selon `.env` |
| C3 | **Hash MetaMask Maire ignoré** | `validation/page.tsx:60` | Backend re-signe = double gas + double event blockchain |
| C4 | **Pinata JWT côté client** | `lib/ipfs.ts:6` | Fuite de clé API garantie en prod |
| C5 | **Alchemy RPC + clé hardcodée** | `useBlockchainVerify.ts:6` | Clé exposée publiquement |
| C6 | **`tempId` Agent ≠ ID Django** | `DepenseForm.tsx:79` | L'event blockchain ne pourra jamais être mappé à la DB après coup |
| C7 | **Rejet transaction = console.log** | `validation/page.tsx:77` | Fonctionnalité fantôme |
| C8 | **Pas de vérification du tx_hash reçu** | `views.py valider_transaction` | N'importe qui (avec rôle Maire DRF) peut envoyer un faux hash |
| C9 | **DebugPanel toujours actif** | `BlockchainProvider.tsx:102` | Visible en production |
| C10 | **MAIRE_ROLE non scopé par commune** | `BudgetLedger.sol` | Un Maire peut signer pour une autre commune on-chain |

---

## 🎯 SYNTHÈSE PRIORISÉE — PROCHAINES ACTIONS

| ORDRE | ACTION | IMPACT | EFFORT |
|---|---|---|---|
| 1 | Unifier l'adresse de contrat (1 seule source de vérité) | 🔴 Critique | 🟢 Faible |
| 2 | Corriger flux validation Maire : transmettre le hash MetaMask au backend | 🔴 Critique | 🟢 Faible |
| 3 | Déplacer Pinata upload côté backend (proxy) | 🔴 Sécu | 🟡 Moyen |
| 4 | Synchroniser ID Django ↔ depenseId blockchain (créer le record AVANT la signature) | 🔴 Critique | 🟡 Moyen |
| 5 | Implémenter rejet transaction (API + persistance) | 🔴 Bloqueur démo | 🟢 Faible |
| 6 | UI DGDDL : attribuer rôles Agent/Maire on-chain | 🔴 Bloqueur démo | 🟡 Moyen |
| 7 | Connecter SignalementsCommune à l'API existante | 🟡 | 🟢 Faible |
| 8 | Connecter BudgetCommune à un modèle Django `BudgetAnnuel` | 🟡 | 🔴 Élevé |
| 9 | Créer app `apps.citoyens` (KYC) | 🟡 | 🔴 Élevé |
| 10 | Conditionner DebugPanel à `NODE_ENV !== "production"` | 🟢 | 🟢 Trivial |
| 11 | Variables d'env : `NEXT_PUBLIC_PINATA_JWT` → `PINATA_JWT` (backend) | 🔴 | 🟢 Faible |
| 12 | Audit on-chain automatisé (job cron) | 🟡 | 🔴 Élevé |
| 13 | Génération PDF rapports réelle (jsPDF / WeasyPrint) | 🟡 | 🟡 Moyen |
| 14 | UI enregistrement recette pour Maire | 🟡 | 🟡 Moyen |
| 15 | V2 : Multisig 3-sur-5 (nouveau contrat) | 🟢 | 🔴 Élevé |
| 16 | V2 : Migration Mainnet | 🟢 | 🔴 Élevé |

---

**Audit final validé par Antigravity — 2026-05-08**
*Cartographie chirurgicale complète : 26 lignes de logique générale, 22 lignes de blockchain détaillée, 4 acteurs détaillés flux par flux, 10 bugs critiques nommés, 16 actions priorisées.*
