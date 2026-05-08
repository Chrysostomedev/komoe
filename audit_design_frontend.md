# 🎨 AUDIT DESIGN / CSS / THÈME — KOMOE
**Date** : 2026-05-08
**Périmètre** : Visibilité formulaires, cohérence light/dark, tokens CSS, accessibilité visuelle
**Verdict global** : 🔴 **CRITIQUE** — Le design system n'est PAS theme-aware. Les formulaires sont quasi inutilisables en mode clair (texte blanc sur fond blanc).

---

## 🔥 PROBLÈME RACINE (1 cause → 80% des bugs visuels)

Le projet a été codé **uniquement pour le thème sombre**. Les classes Tailwind utilisées sont des couleurs **hardcodées** (`text-white`, `text-white/40`, `bg-card/5`, `border-white/10`) au lieu d'utiliser les **tokens sémantiques** définis dans `globals.css` (`text-foreground`, `bg-muted`, `border-border`).

Conséquence : quand l'utilisateur passe en **mode clair** (light) :
- Les textes restent **blancs** sur fond **blanc** → invisibles
- Les bordures `border-white/10` disparaissent
- Les fonds `bg-card/5` deviennent transparents sur du blanc → champs fantômes
- Les placeholders `text-white/40` sont illisibles

`ThemeProvider` ([app/layout.tsx:28](app/layout.tsx#L28)) est configuré avec `defaultTheme="system"` → si l'OS utilisateur est en mode clair, **toute l'interface devient inutilisable dès le chargement**.

---

## 📋 TABLEAU 1 — BUGS CRITIQUES `globals.css`

| # | LIGNE | BUG | IMPACT |
|---|---|---|---|
| G1 | [globals.css:96](app/globals.css#L96) | `--color-brand-blue: var(--secondary);` ❌ Devrait être `var(--brand-blue)` | La classe `bg-brand-blue` (utilisée dans Sidebar) renvoie en réalité la couleur `secondary` → sidebar grise au lieu de bleu nuit |
| G2 | [globals.css:69-105](app/globals.css#L69-L105) | Tokens `--color-card-foreground`, `--color-foreground`, `--color-muted-foreground` exposés mais jamais utilisés dans les composants (qui forcent `text-white`) | Le système de tokens est cosmétique, le thème ne s'applique pas |
| G3 | Aucune définition de `prose-invert` ou `dark:prose-invert` | RichTextEditor utilise `prose prose-slate` qui force toujours le texte sombre | Texte invisible en dark / OK en light |
| G4 | Pas de styles globaux `<input>`/`<select>`/`<textarea>` | Aucun fallback : tout dépend des classes Tailwind dans chaque composant | Une seule classe oubliée = champ invisible |
| G5 | `--destructive: #7f1d1d` en dark | Couleur quasi noire sur fond noir | Boutons "Supprimer" invisibles en dark |

---

## 📋 TABLEAU 2 — `ReusableForm.tsx` (LE PIRE OFFENSEUR — 53 occurrences `text-white`)

| # | LIGNE | COMPOSANT | PROBLÈME | EN MODE CLAIR | EN MODE SOMBRE |
|---|---|---|---|---|---|
| F1 | [ReusableForm.tsx:34](components/ui/ReusableForm.tsx#L34) | `DateRangePicker` | `text-foreground dark:text-white` ✅ OK | OK | OK |
| F2 | [ReusableForm.tsx:54](components/ui/ReusableForm.tsx#L54) | `Input` | `text-foreground dark:text-white` ✅ OK mais `bg-muted/50` peu contrasté | Fond très clair, OK | OK |
| F3 | [ReusableForm.tsx:69](components/ui/ReusableForm.tsx#L69) | `Select` chevron | `stroke="#64748B"` hardcodé | OK | Peu visible |
| F4 | [ReusableForm.tsx:109](components/ui/ReusableForm.tsx#L109) | `Checkbox` | `border-2 border-white/10 checked:border-slate-900` | **Bordure invisible (blanc/blanc)** 🔴 | OK |
| F5 | [ReusableForm.tsx:116](components/ui/ReusableForm.tsx#L116) | `Checkbox` label | `text-white/80` | **TEXTE INVISIBLE** 🔴 | OK |
| F6 | [ReusableForm.tsx:144](components/ui/ReusableForm.tsx#L144) | `DateInput` | `[&>button]:text-white/80 [&>button]:bg-card/5 [&>button]:border-white/10` | **TEXTE INVISIBLE** 🔴 | OK |
| F7 | [ReusableForm.tsx:170](components/ui/ReusableForm.tsx#L170) | `DateRangeInput` | idem F6 | **INVISIBLE** 🔴 | OK |
| F8 | [ReusableForm.tsx:294](components/ui/ReusableForm.tsx#L294) | `ImageUpload` dropzone | `bg-card/5 hover:bg-card/10` (alpha sur card blanc en light) | **ZONE DROP FANTÔME** 🔴 | OK |
| F9 | [ReusableForm.tsx:301-302](components/ui/ReusableForm.tsx#L301) | `ImageUpload` spinner | `border-white/20`, `text-white/50` | **INVISIBLE** 🔴 | OK |
| F10 | [ReusableForm.tsx:312-321](components/ui/ReusableForm.tsx#L312) | `ImageUpload` icônes/textes | `text-white/50`, `text-white/80`, `text-white/40` | **TOUT INVISIBLE** 🔴 | OK |
| F11 | [ReusableForm.tsx:362](components/ui/ReusableForm.tsx#L362) | `ImageUpload` chip filename | `bg-primary/60` + `text-white` | OK (orange) | OK |
| F12 | [ReusableForm.tsx:379](components/ui/ReusableForm.tsx#L379) | Bouton X remove | `text-white/80` sur `bg-card/90` | Croix blanc/blanc | OK |
| F13 | [ReusableForm.tsx:489-503](components/ui/ReusableForm.tsx#L489) | `PhoneInput` | `text-white/60`, `text-white/80`, `placeholder:text-white/40` | **CHAMP TÉL INVISIBLE** 🔴 | OK |
| F14 | [ReusableForm.tsx:551-587](components/ui/ReusableForm.tsx#L551) | `RichTextEditor` | `bg-card/5`, `bg-card/15/50` (Tailwind invalide), `text-white/80` | **ÉDITEUR FANTÔME** 🔴 | OK |
| F15 | [ReusableForm.tsx:552](components/ui/ReusableForm.tsx#L552) | Toolbar | `bg-card/15/50` ❌ Classe Tailwind **invalide** (double slash) | Aucune couleur appliquée | Aucune couleur |
| F16 | [ReusableForm.tsx:716-744](components/ui/ReusableForm.tsx#L716) | `PdfUpload` | Mêmes erreurs que F8-F10 | **INVISIBLE** 🔴 | OK |
| F17 | [ReusableForm.tsx:783](components/ui/ReusableForm.tsx#L783) | `PdfUpload` filename | `text-white truncate` | **NOM FICHIER INVISIBLE** 🔴 | OK |
| F18 | [ReusableForm.tsx:849-934](components/ui/ReusableForm.tsx#L849) | `QuoteItemsInput` | 28 occurrences `text-white*` | **TABLEAU DEVIS ENTIÈREMENT INVISIBLE** 🔴 | OK |
| F19 | [ReusableForm.tsx:869](components/ui/ReusableForm.tsx#L869) | Item input | `bg-card/5 border border-white/10 text-white placeholder:text-white/40` | **CHAMPS LIGNES DEVIS INVISIBLES** 🔴 | OK |
| F20 | [ReusableForm.tsx:932](components/ui/ReusableForm.tsx#L932) | Total bordure | `border-white/10/60` ❌ Classe **invalide** | Aucune bordure | Aucune bordure |

---

## 📋 TABLEAU 3 — Composants UI globaux

| # | FICHIER | PROBLÈME | SÉVÉRITÉ |
|---|---|---|---|
| U1 | [components/ui/DocumentPreview.tsx](components/ui/DocumentPreview.tsx) | 5 occ. `text-white` / `text-slate-X` hardcodées | 🔴 |
| U2 | [components/ui/StatsCard.tsx](components/ui/StatsCard.tsx) | 2 occ. `text-white/X`, 1 `bg-card/X` | 🟡 |
| U3 | [components/ui/Button.tsx](components/ui/Button.tsx) | 2 occ. `text-white` (variante "primary" OK car fond orange, mais "ghost" peut hériter) | 🟡 |
| U4 | [components/ui/BlockchainMap.tsx](components/ui/BlockchainMap.tsx) | 3 occ. couleurs hardcodées | 🟡 |
| U5 | [components/ui/DataTable.tsx](components/ui/DataTable.tsx) | 1 occ. couleur fixe | 🟡 |
| U6 | [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx) | 12 occ. `text-white` + utilise `bg-brand-blue` qui est cassé (G1) | 🔴 |

---

## 📋 TABLEAU 4 — Pages métier (formulaires concrets)

| PAGE | PROBLÈME OBSERVABLE EN LIGHT MODE |
|---|---|
| [components/agent/DepenseForm.tsx](components/agent/DepenseForm.tsx) | Hérite de `ReusableForm` → **TOUS LES CHAMPS INVISIBLES** : montant, description, devis, upload PDF, période. Le formulaire de saisie de dépense (cœur métier) est inutilisable. |
| [app/commune/validation/page.tsx](app/commune/validation/page.tsx) | Drawer rejet (motif) → textarea + boutons → invisible |
| [app/public/verifier/page.tsx](app/public/verifier/page.tsx) | Champ recherche hash (input) → potentiellement invisible |
| [app/public/signalement/page.tsx](app/public/signalement/page.tsx) | Formulaire signalement citoyen → invisible (utilisateur public !) |
| Pages auth (login) | À vérifier — probablement même problème |

⚠️ **Le citoyen lambda qui arrive sur `/public/signalement` en mode clair voit un formulaire blanc vide.**

---

## 📋 TABLEAU 5 — Toggle de thème

| ÉLÉMENT | LIEU | ÉTAT |
|---|---|---|
| Bouton Sun/Moon | [Header.tsx:4](components/layout/Header.tsx) (importé) | Importé mais l'usage exact à vérifier |
| `ThemeProvider` | [app/layout.tsx:28](app/layout.tsx#L28) | ✅ Configuré `attribute="class" defaultTheme="system" enableSystem` |
| `next-themes` | package.json | ✅ Installé |
| **Cohérence** | — | 🔴 Le toggle existe mais **bascule entre "noir lisible" et "blanc illisible"** |

---

## 🔴 BUGS TAILWIND CASSÉS (classes invalides)

Ces classes ne génèrent **aucun** style — silencieusement ignorées :

| LIEU | CLASSE INVALIDE | DEVRAIT ÊTRE |
|---|---|---|
| [ReusableForm.tsx:552](components/ui/ReusableForm.tsx#L552) | `bg-card/15/50` | `bg-card/15` ou `bg-card/50` |
| [ReusableForm.tsx:932](components/ui/ReusableForm.tsx#L932) | `border-white/10/60` | `border-white/10` |
| [ReusableForm.tsx:862](components/ui/ReusableForm.tsx#L862) | `hover:bg-card/5/50` | `hover:bg-card/50` |

(à grep dans tout le projet — il y en a probablement plus)

---

## 🟠 PROBLÈMES D'ACCESSIBILITÉ / CONTRASTE

| # | PROBLÈME | RÉFÉRENCE WCAG |
|---|---|---|
| A1 | `text-white/40` en dark = ratio < 3:1 sur `--background: #020617` | Échec WCAG AA (4.5:1) |
| A2 | `placeholder:text-white/40` partout | Placeholders non lisibles (contre-WCAG) |
| A3 | Aucun `aria-label` sur les boutons icônes (X remove, ToolbarButton, etc.) | Échec lecteurs d'écran |
| A4 | `focus:ring-primary` OK mais `focus:border-transparent` fait disparaître la bordure → focus peu visible | Accessibilité clavier |
| A5 | Pas de `prefers-reduced-motion` sur les animations `animate-fade-in` | Vestibulaires |

---

## 🎯 CAUSES RACINES (en ordre de gravité)

1. **🔴 CRITIQUE — Mauvais réflexe d'écriture** : utilisation systématique de `text-white`, `bg-card/X`, `border-white/10` au lieu des tokens sémantiques `text-foreground`, `bg-muted`, `border-border`. Ces classes sont **immuables** et n'écoutent pas le thème.

2. **🔴 CRITIQUE — `ReusableForm` codé "dark-only"** : le composant central de tous les formulaires (54 occurrences problématiques) a été designé pour un thème unique sombre.

3. **🔴 BUG CSS — Token `--color-brand-blue` mal défini** dans `globals.css:96` (`var(--secondary)` au lieu de `var(--brand-blue)`).

4. **🟠 Classes Tailwind invalides** (3+ lignes avec double slash `/X/Y`) silencieusement ignorées.

5. **🟠 `defaultTheme="system"`** : le projet expose l'utilisateur au thème clair par défaut sans avoir testé ce mode → tous les utilisateurs avec OS en mode clair voient une UI cassée à la première visite.

6. **🟡 Pas de Storybook / pas de tests visuels** : aucune protection contre la régression visuelle.

---

## ✅ PLAN DE CORRECTION PRIORISÉ

| ORDRE | ACTION | FICHIER(S) | EFFORT |
|---|---|---|---|
| 1 | **Remède rapide** : forcer `defaultTheme="dark"` et désactiver `enableSystem` (gel l'app en dark le temps de fixer) | [app/layout.tsx:28](app/layout.tsx#L28) | 🟢 1 min |
| 2 | Fixer `--color-brand-blue` → `var(--brand-blue)` | [globals.css:96](app/globals.css#L96) | 🟢 1 min |
| 3 | Corriger les classes Tailwind invalides (`/X/Y`) | grep `/\d+\/\d+/` dans tout `components/` | 🟢 10 min |
| 4 | **Refactor `ReusableForm.tsx`** : remplacer toutes les `text-white*` → `text-foreground*`, `bg-card/X` → `bg-muted` ou `bg-card`, `border-white/10` → `border-border`, `placeholder:text-white/40` → `placeholder:text-muted-foreground` | [ReusableForm.tsx](components/ui/ReusableForm.tsx) | 🟡 1-2 h |
| 5 | Ajouter `dark:` modifier là où une nuance est nécessaire (vraiment besoin de différencier) | tout `components/` | 🟡 2 h |
| 6 | Auditer `Sidebar.tsx`, `Header.tsx`, `StatsCard.tsx`, `DocumentPreview.tsx` selon le même pattern | 4 fichiers | 🟡 1 h |
| 7 | Définir un token `--destructive` sombre lisible (`#dc2626` même en dark) | [globals.css:62](app/globals.css#L62) | 🟢 5 min |
| 8 | Ajouter `aria-label` sur les boutons icônes | divers | 🟡 30 min |
| 9 | Tester chaque page en alternant light/dark + capturer des screenshots de validation | tous | 🟡 1 h |
| 10 | (Optionnel) Mettre en place Storybook ou Playwright visuel pour figer le design system | infra | 🔴 1 j |

---

## 📐 RÈGLE D'OR à imposer dans le projet

> **Aucune classe ne doit contenir `text-white`, `text-black`, `bg-white`, `bg-slate-*`, `border-white/*`, `text-slate-*` à l'exception explicite de :**
> - Boutons sur fond coloré primary/destructive (où la couleur de texte est garantie)
> - Composants explicitement mono-thème (overlay opaque sombre, etc.)
>
> **Toujours préférer** :
> - `text-foreground` / `text-muted-foreground`
> - `bg-background` / `bg-card` / `bg-muted`
> - `border-border` / `border-input`
> - `placeholder:text-muted-foreground`

Un lint Tailwind (regex CI) sur ces classes éviterait toute régression.

---

**Audit design final — 2026-05-08**
*Bilan : 1 cause racine, ~80 lignes de code à corriger, formulaire métier (DepenseForm) inutilisable en mode clair, citoyen public exposé à des écrans blancs. Correction estimée : 3-5h pour rendre l'app theme-aware proprement.*
