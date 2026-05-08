pour l'Étape 0 : Configuration de l'Infrastructure. Nous allons préparer les "clés de la ville" pour KOMOE.
Suis ces trois étapes dans l'ordre. Dès que tu as une information (une clé ou une URL), garde-la précieusement, nous les mettrons ensemble dans le fichier .env à la fin.

1️⃣ Alchemy (Le Pont RPC Blockchain)
**Objectif** : Créer une passerelle pour que KOMOE puisse lire et écrire sur la blockchain.

**Étapes détaillées :**
1.  **Création du compte** : Aller sur Alchemy.com et choisir le plan **FREE** ($0/mo).
2.  **Configuration de l'App** :
    *   **Name** : `KOMOE-Dev`
    *   **Use Case** : `Wallet` ou `Other`
3.  **Choix de la Blockchain** : Sélectionner **Polygon PoS** (le premier choix "Full Platform Support").
4.  **Choix du Réseau (CRITIQUE)** : Sélectionner **AMOY**. 
    *   *Attention : Ne pas choisir Mainnet, car cela nécessite de l'argent réel.*
5.  **Activation des services** : Laisser **Node API** activé par défaut et cliquer sur "Create App".

**⚠️ Erreurs à éviter (Leçons apprises) :**
- **Erreur de réseau** : Ne pas confondre `Polygon Mainnet` (réel) avec `Polygon Amoy` (test). Si l'URL commence par `polygon-mainnet`, les transactions échoueront faute de fonds réels.
- **Confusion zkEVM** : Ne pas choisir `Polygon zkEVM`. Bien rester sur `Polygon PoS`.
- **Exposition des clés** : L'URL HTTPS contient ta clé API. Ne jamais la pousser sur un dépôt GitHub public.

**Résultat attendu :** 
Une URL HTTPS de type : `https://polygon-amoy.g.alchemy.com/v2/TA_CLE_API`
✅ **Endpoint obtenu** : `https://polygon-amoy.g.alchemy.com/v2/d3XA6IZwwIHPLiHaQyG-s`

2️⃣ Pinata (Le Coffre-Fort IPFS)
**Objectif** : Stocker les justificatifs PDF de manière immuable.

**Étapes réalisées :**
1.  **Plan** : Choix du plan **FREE** (jusqu'à 1GB de stockage gratuit).
2.  **Génération de clé** : Création d'une clé nommée `KOMOE-Storage`.
3.  **Permissions** : Mode **Admin** activé (permet de lire et écrire sans restriction).

**⚠️ Points de vigilance :**
- **JWT (Secret Access Token)** : C'est la clé la plus longue. Elle est indispensable pour que le backend puisse uploader des fichiers.
- **Affichage unique** : Pinata n'affiche ces clés qu'une seule fois. Si on les perd, il faut en recréer de nouvelles.

✅ **JWT obtenu** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2YWZjOTQwZC05M2I2LTQzMTgtOGQwZS01YmQzMDAwNWUxYjIiLCJlbWFpbCI6InRlYW1hbmltZTIyNUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZjZhY2QzMzRhNjc3MWY1NjQzZjAiLCJzY29wZWRLZXlTZWNyZXQiOiJiZmNiNzJmZjYyMzk1ZWNiZjM2NzFkM2IwNzU3YzU0MDlmMjVjNzUxZTA2NDA5MTNlM2NiOTFmYmM3ZDEwZjU3IiwiZXhwIjoxODA5NzA4MDE4fQ.w_4XMdS_veEZBAhQUwXGU-_5q9h8juq3qQrSdIFNkcg`

3️⃣ MetaMask (Ton identité numérique)
**Objectif** : Créer ton portefeuille, configurer le réseau Amoy et obtenir du gaz (POL) pour payer les transactions.

### 📜 Tutoriel de Configuration Manuelle (Infaillible) :

#### 1. Installation & Création
- **Lien** : [metamask.io/download](https://metamask.io/download/)
- **Action** : Installer l'extension, créer un nouveau portefeuille et **noter précieusement la phrase secrète de 12 mots**.
- **Sécurité** : Ne jamais partager tes 12 mots. C'est l'unique accès à tes fonds.

#### 2. Faire apparaître le réseau Polygon Amoy
*Si le réseau n'est pas dans la liste automatique, suis ces étapes exactes :*
1.  Ouvre MetaMask et clique sur le sélecteur de réseau (en haut à gauche).
2.  Clique sur l'onglet **"Custom"** (Personnalisé).
3.  Clique sur le gros bouton blanc **"+ Ajouter un réseau personnalisé"**.
4.  Remplis le formulaire avec ces informations précises :
    - **Nom du réseau** : `Polygon Amoy`
    - **URL de RPC** : `https://rpc-amoy.polygon.technology`
    - **ID de chaîne** : `80002`
    - **Symbole** : `POL`
    - **Explorateur** : `https://amoy.polygonscan.com`
5.  Clique sur **Sauvegarder** et accepte de "Passer au réseau".

#### 3. Obtenir de l'argent gratuit (Le Faucet)
- **Lien** : [faucet.polygon.technology](https://faucet.polygon.technology/)
- **Procédure** :
    - Choisis `Polygon Amoy` et `POL`.
    - Connecte-toi impérativement avec **X.COM** (Twitter) pour valider ton identité.
    - Colle ton adresse (`0x5F6549...`) et clique sur **Claim**.
- **Vérification** : Tes jetons arriveront sous 2 à 5 minutes.

#### 4. Comment voir ton solde ?
- Dans MetaMask, assure-toi d'être sur l'onglet **"Jetons"**.
- Ton solde s'affichera en haut : **0.1 POL**.

---
✅ **ÉTAPE 0 VALIDÉE** : Infrastructure Alchemy, Pinata et MetaMask opérationnelle.
✅ **ÉTAPE 1 VALIDÉE** : Smart Contract `BudgetLedger` (Complet) déployé sur Polygon Amoy.
✅ **Adresse Contract** : `0xae3ba377c763d6c622991408932e93430035b05f`
✅ **Adresse Wallet** : `0x5F6549e91D73eC4136e901F7C99972629d076a2c`
✅ **Smart Contract** : `0x3e11caf0c6f751a338a18dd6348f55a403823d54` (Sur Polygon Amoy)
✅ **ÉTAPE 2 VALIDÉE** : Backend Django configuré (RPC, Adresse Contrat et Clé Privée).
🚀 **PROCHAINE ÉTAPE** : Étape 3 - Test d'Interaction (Vérifier le lien Backend <-> Blockchain).