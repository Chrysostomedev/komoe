# 📜 LOGIQUE STRATÉGIQUE — KOMOE (MIABE 2026)

Ce document est le guide de référence pour la présentation du projet KOMOE lors du Hackathon. Il détaille la structure de gouvernance, la séparation des pouvoirs et le scénario de démonstration.

---

## 🏛️ 1. La Logique de "Séparation des Pouvoirs" (3 Rôles)

Pour une démonstration béton, il faut montrer que le système repose sur une collaboration forcée entre différents acteurs.

| Rôle | Acteur | Action sur la plateforme | Pourquoi c'est important ? |
| :--- | :--- | :--- | :--- |
| **AGENT** | Agent Financier | Saisit la dépense + Devis. **(Nécessite son adresse MetaMask propre)** | **Identité Certifiée** : L'adresse de l'agent est liée à sa saisie. On sait exactement qui a préparé le dossier. |
| **MAIRE** | Le Maire / Conseil | Signe avec son MetaMask (Validation). **(Nécessite son adresse MetaMask propre)** | **Responsabilité Politique** : Seule l'adresse enregistrée comme "Maire" peut déclencher la validation finale. |
| **CITOYEN** | Public / Auditeur | Consulte le "Journal d'Audit". (Pas de wallet requis) | **Transparence Totale** : Le public vérifie les signatures des deux adresses précédentes. |

> ⚠️ **IMPORTANT pour la Démo :** Chaque acteur doit utiliser une adresse MetaMask **différente**. Le Smart Contract vérifie l'adresse de celui qui envoie la transaction (`msg.sender`). Si l'adresse n'est pas autorisée, la blockchain rejette l'action.

---

## 🛡️ 2. Comment expliquer la "Limite" aux juges

Si les juges posent des questions sur la sécurité ou la triche, voici les réponses "clés en main" :

### A. Gouvernance par la DGDDL (Admin)
Le contrat utilise le standard **AccessControl**. Le Maire n'est pas le "propriétaire" du contrat, c'est l'État (DGDDL) qui possède le rôle `DEFAULT_ADMIN_ROLE`.
- **Scénario :** Si un Maire est révoqué ou perd sa clé, la DGDDL peut techniquement lui retirer son droit de signature (`revoquerRole`) et l'attribuer à son successeur. Cela garantit la **continuité du service public**.

### B. Évolution vers la Multi-Signature (Multi-Sig)
Tu peux expliquer que la prochaine étape est de ne plus dépendre d'une seule signature.
- **Le concept :** Pour les grosses dépenses (> 50 millions), il faudrait que **3 adjoints sur 5** signent avec leur propre MetaMask pour que la transaction soit validée. C'est le niveau ultime de décentralisation.

---

## 💡 3. Plan de Test pour la Démo (Pas à Pas)

Utilise 3 comptes MetaMask différents (Account 1, 2, 3) pour montrer le flux :

1.  **Phase 1 : Saisie (Account 1 - Agent)**
    - Connecté en tant qu'Agent Financier.
    - Tu crées une dépense de 1 000 000 FCFA pour "Achat de Ciment".
    - Tu montres que la dépense apparaît en orange (**SOUMIS**) et que l'Agent ne peut pas la valider lui-même.

2.  **Phase 2 : Validation (Account 2 - Maire)**
    - Tu changes de compte MetaMask vers celui du Maire.
    - Tu montres que la dépense est apparue dans ton "Tableau de Bord Maire".
    - Tu cliques sur **"Signer sur Polygon"** et tu valides la transaction MetaMask.

3.  **Phase 3 : Preuve (Account 3 - Citoyen)**
    - Tu montres (éventuellement en navigation privée) que la dépense est maintenant passée en vert (**CONFIRMÉ**).
    - Tu cliques sur le lien **PolygonScan** pour montrer que la preuve est publique, mondiale et ineffaçable.

---

## ⚖️ 4. Logique du "Flux de Confiance" (Résumé pour le Pitch)
- **Flux de Confiance :** Personne ne peut valider ce qui n'a pas été préparé. Personne ne peut préparer ce qui ne sera pas validé.
- **Preuve par l'Évidence :** Pas besoin de permission pour auditer la mairie. La blockchain rend les comptes publics par défaut.
- **Sécurité d'État :** La technologie blockchain au service de l'administration ivoirienne.

---
**KOMOE : La transparence au service du citoyen. 🇨🇮🔥**
