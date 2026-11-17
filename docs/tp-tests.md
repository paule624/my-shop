# TP « my-shop sous protection » : notes d'étapes

Branche `seance-5`. Chaque étape, ce qu'elle protège, et la réponse au point de contrôle avec sa preuve. Commandes : `npm test`, `npm run test:e2e`, `npm run test:coverage` (voir le README).

| Étape | Commit | Résultat |
|---|---|---|
| 1. Vitest, logique métier | `55e8408` `test: unit cart and search logic` | 16 tests unitaires |
| 2. RTL, ce que l'utilisateur constate | `2e73724` `test: product card and pages` | 6 tests de composants |
| 3. Playwright, parcours critique | `da06320` `test: e2e catalog to cart journey` | 2 parcours e2e (dont le bonus connexion) |
| 4. Couverture | `581d756` `test: coverage report and readme score` | 29,79 % des lignes, noté dans le README |
| Bonus Storybook | `chore: product card stories` | 3 stories de la carte produit, scannées par axe |

**Rouge avant vert.** Chaque test a échoué au moins une fois. Pour chacun, on a cassé le code exprès, constaté le rouge, puis restauré : 17 mutations à l'étape 1, 8 à l'étape 2, 3 à l'étape 3. Aucun test n'est resté vert sous toutes les mutations.

---

## Étape 1 : Vitest, la logique métier

- **Installation** : `vitest.config.ts` réutilise la config Vite avec `mergeConfig`, donc même plugin React et même alias `@`. Il ne collecte que `src/**/*.test.ts(x)` : le dossier `e2e/` appartient à Playwright. `src/test/setup.ts` charge les matchers DOM (`@testing-library/jest-dom/vitest`) et démonte le rendu après chaque test (`cleanup`).
- **Extraction** : le reducer du panier quitte `src/types/` pour `src/features/cart/cart.ts`, à côté de son test. `computeCartTotal` est créé (le panier n'affichait pas de total) et utilisé dans le panneau du panier.
- **Le test qui a trouvé un bug** : « ignorer un ajout de quantité 0 » était rouge dès sa création. Ajouter 0 article créait une ligne « Quantité : 0 ». Le reducer a été corrigé.
- **Recherche** : la logique d'URL du catalogue (lire `?sort&category&page`, changer un filtre, lien de page) sort de `ProductsPage` vers `catalogParams.ts`, une fonction pure. Elle teste notamment qu'une URL bricolée (`page=-3`, `sort=drop-table`) retombe sur les valeurs par défaut.

**Point de contrôle 1.** « Où sont l'Arrange, l'Act et l'Assert ? Si demain quelqu'un casse cette fonction, que voit-il, à quel moment ? »
- Dans `cart.test.ts`, le premier test les annote : **Arrange** (le panier écrit à la main), **Act** (un appel à `applyAction`), **Assert** (le `expect`). Les suivants gardent ces trois blocs, séparés par une ligne vide.
- Si quelqu'un remplace `*` par `+` dans `computeCartTotal`, il le voit **en quelques millisecondes** : dès la sauvegarde avec `npm run test:watch`, et sinon au `npm test` avant le commit. Il voit le nom du test qui échoue (« additionne prix × quantité… »), la valeur attendue (282.9) et la valeur reçue. Mesuré : cette mutation fait rougir 3 tests.

## Étape 2 : RTL, ce que l'utilisateur constate

- **`renderWithProviders`** (`src/test/utils.tsx`) : un QueryClient neuf par test (`retry: false`), un `MemoryRouter` sur l'URL choisie, et le contexte d'authentification (visiteur déconnecté par défaut), car le panier et la page de connexion le lisent.
- **Carte produit** : le nom et le prix sont visibles, et le bouton est trouvé par son rôle. Le clic arrive dans le store Zustand, qu'on relit hors de React et qu'on vide avant chaque test. Un produit épuisé a son bouton désactivé.
- **Page Produits** : Supabase est remplacé par un faux client écrit à la main. Il enregistre la requête (`order`, `eq`, `range`) et renvoie deux produits. Le faux ne filtre pas, puisque filtrer est le travail de la base. Le test vérifie ce que la page **demande** : le filtre de l'URL arrive dans la requête, et changer le tri réécrit l'URL et revient à la page 1.
- **Connexion** : des identifiants invalides affichent le message de Supabase (`role="alert"`). Des champs vides ne partent pas : la validation native `required` bloque l'envoi, et jsdom l'applique aussi.

**Point de contrôle 2.** « Pourquoi `getByRole` plutôt qu'une classe CSS ? Pourquoi `retry: false` ? »
- **`getByRole`** cherche l'élément comme un utilisateur ou un lecteur d'écran le trouve : « le bouton Ajouter au panier ». Une classe CSS change au moindre restylage et ne garantit rien sur l'accessibilité. Mesuré : quand on remplace le `<button>` par un `<div>` cliquable, les deux tests de la carte rougissent, parce qu'un `div` n'est pas un bouton pour le clavier ni pour le lecteur d'écran. Le test pousse vers le bon HTML.
- **`retry: false`** : par défaut, React Query retente une requête en échec **3 fois**, avec une attente croissante. En test, une erreur voulue (Supabase qui refuse) mettrait plusieurs secondes à s'afficher, et le test traînerait ou dépasserait son délai. Sans retry, l'erreur arrive tout de suite. Le QueryClient neuf à chaque test évite aussi qu'un test hérite du cache du précédent.

## Étape 3 : Playwright, le parcours critique

- **Config** : `playwright.config.ts`, avec les tests dans `e2e/`, hors de `src/`. Playwright lance le serveur de dev lui-même, ou réutilise celui qui tourne. En cas d'échec, il garde une capture et une trace : `npx playwright show-report`.
- **`shop.spec.ts`** : accueil → « Boutique » dans le menu principal → premier produit achetable → le compteur affiche « Panier 1 article(s) » et le produit choisi apparaît dans le panier. Le test tourne sur le vrai catalogue Supabase.
- **`auth.spec.ts`** (bonus) : `/account` renvoie vers `/login`, la connexion ramène sur `/account`, puis on se déconnecte. Le compte de test est lu dans le `.env` (`E2E_EMAIL`, `E2E_PASSWORD`), qui n'est jamais commité. Sans ces variables, le test est ignoré.
- **Lire un échec** : on a remplacé « Quantité : 1 » par « Quantité : 2 » dans le test. Le rapport montre le texte attendu face au texte reçu, la ligne du test, une capture et une trace.

**Point de contrôle 3.** « Ce test e2e et le test RTL de la carte : quelle différence ? Lequel casse si on redessine, lequel si on casse la logique ? »
- **La différence** : le test RTL rend **un composant seul**, dans jsdom, avec de fausses données. Il est rapide et précis : il dit quel composant est fautif. L'e2e pilote **la vraie app** dans un vrai navigateur, sur le vrai Supabase. Il est plus lent, mais il prouve que les morceaux fonctionnent ensemble.
- **Mesuré, en lançant les deux suites sous chaque mutation :**

| On casse… | Vitest (unitaires + composants) | Playwright (e2e) |
|---|---|---|
| Le design : le lien « Boutique » devient « Catalogue » | vert | **rouge** |
| La logique : le total additionne au lieu de multiplier | **3 rouges** | vert (il ne vérifie pas le total) |
| Le branchement : « Déconnexion » ne déconnecte plus | vert | **rouge** |

- Le parcours e2e casse dès qu'on change ce que l'utilisateur lit ou fait. Les tests unitaires cassent sur la logique, et disent exactement laquelle. Les deux sont complémentaires.

## Étape 4 : la couverture

- `@vitest/coverage-v8`, avec `npm run test:coverage`. Le rapport HTML est dans `coverage/index.html`, un dossier ignoré par Git et par ESLint. Attention : le résumé texte masque les fichiers couverts à 100 % (`catalogParams.ts`, par exemple). Le rapport HTML les montre.
- **Score du 17/11/2026 : 29,79 % des lignes**, noté dans le README. Il ne compte que Vitest : les parcours Playwright exécutent bien plus de code, mais ne sont pas mesurés.

**Point de contrôle 4.** « Votre fichier le moins couvert, et pourquoi la fonction choisie mérite le prochain test ? »
- Plusieurs fichiers sont à 0 %. Celui qu'on choisit, c'est **`src/types/orders.ts`**, pour sa fonction **`orderTotal`** :
  - c'est de l'argent montré au client (`/account`), à l'admin et exporté en CSV ;
  - le test de `computeCartTotal` nous a appris que JavaScript calcule mal les centimes, et `orderTotal` n'arrondit pas : avec un prix à 24,90 €, 3 tasses donnent « 74.69999999999999 € » (vérifié). Ça ne se voit pas encore parce que les prix actuels sont entiers, mais le formulaire admin accepte les centimes ;
  - c'est une fonction pure : un test en quelques millisecondes.
- On ne choisit **pas** un fichier d'affichage à 0 % (admin, détail produit) juste pour monter le score : le risque y est faible, et les parcours e2e les traversent déjà.

## Après le TP : les tests ajoutés pour le risque

Le TP couvrait la logique, les composants et un parcours. Trois risques restaient sans filet. On les a classés par gravité, et la montée en charge passe en dernier : sans serveur à nous, elle mesurerait l'offre gratuite de Supabase ou l'ordinateur local, pas notre code.

| Commit | Test | Ce qu'il a trouvé ou prouvé |
|---|---|---|
| `ad2b1bc` `fix: round order totals to the cent` | `orderTotal`, `ordersTotal` (4 tests Vitest) | Le test choisi à l'étape 4 était **rouge dès sa création** : 74.69999999999999 €. Corrigé avec `roundToCents` (`src/lib/money.ts`), partagé avec le panier. |
| `148a2d0` `test: automated accessibility checks in e2e` | axe-core dans Playwright, 9 états de pages en WCAG 2.1 AA | Protège le travail de la séance 3, y compris l'espace client et l'admin. |
| `test: database security (RLS) checks` | 16 tests sur le vrai Supabase (`npm run test:rls`) | Les preuves des points de contrôle 3 et 4 deviennent automatiques. |

**Accessibilité, mesuré.** Sous chaque régression, voici ce que voient les tests :

| Régression | Vitest | Playwright + axe |
|---|---|---|
| Texte secondaire plus clair (`--muted` #676f6a → #a3aaa6) | vert | **9 pages rouges** |
| Label Email détaché de son champ | 2 rouges (`getByLabelText`) | 5 rouges |
| Photo du détail produit sans `alt` | vert | 1 rouge |
| Champ Prix de l'admin sans label | vert | 1 rouge |

Les tests tournent en `prefers-reduced-motion` : scannées pendant leur fondu d'apparition, les cartes semblaient manquer de contraste, ce qui donnait de faux échecs. L'app raccourcit déjà les animations dans ce mode, donc axe vérifie le rendu final.

**Sécurité RLS** (`supabase/tests/rls.test.ts`). On teste avec la clé publique seulement, celle que tout visiteur trouve dans le JavaScript du site.
- **Visiteur** : il lit le catalogue (contrôle) ; il ne lit aucune commande ; il ne crée pas de produit ; il ne commande pas (refus `42501`).
- **Client** : il ne lit que ses commandes et ses lignes, même avec l'id d'une commande étrangère. Il ne commande ni au nom d'un autre ni « déjà payé ». Il ne crée, ne modifie ni ne supprime de produit (0 ligne touchée, produit intact). Il ne lit que son profil et ne peut pas le modifier. Il n'envoie pas d'image dans le stockage.
- **Admin** (contrôles positifs) : il lit les commandes de plusieurs comptes et peut modifier un produit. Sans ces contrôles, un refus pourrait passer « par vide ».
- **Aucun dégât possible, même si une policy casse** : les écritures interdites visent un produit jetable créé par l'admin pour le test, puis supprimé. Le test « se nommer admin » écrit `role = 'user'` : si la policy laissait passer, la ligne renvoyée le révèle, sans donner de droits.

**Vu rouge pour de vrai.** On a ouvert des trous temporaires dans la base (`create policy "TEMP leak…"`), lancé la suite, puis tout refermé.
- **Tour 1** (lire toutes les commandes, modifier les produits `rls-test-*`, modifier son profil) : 4 tests rouges, exactement ceux visés.
- **Tour 2** (un anonyme lit les commandes ; lecture de tous les profils et de toutes les lignes ; création de produits `rls-hack-*`, de commandes et de lignes) : 8 tests rouges, exactement ceux visés. Les 5 lignes passées par les trous ont été supprimées par leur id, et la suite est revenue à 16/16.
- **Contrôles admin** : exécutés avec l'identité du client, ils rougissent.
- **Pas vu rouge : l'upload d'image refusé au client** (1 test sur 16). Ouvrir ce trou aurait laissé un fichier dans le stockage.
- Ce rituel a aussi trouvé **deux tests faibles**, corrigés avant d'être validés. « L'anonyme ne peut pas commander » passait grâce au contrôle de stock : le produit visé était épuisé. Il vise maintenant un produit en stock et exige `42501`. Et le contrôle admin restait vrai pour un client qui ne voit que ses commandes.

## Bonus Storybook : le catalogue des composants

- **Installation** : `npx storybook@latest init` (Storybook 10, builder Vite), avec seulement les fonctionnalités `docs` et `a11y`. On a exclu `test` (il aurait modifié la config Vitest), l'onboarding, l'IA et la télémétrie. Les exemples générés (`src/stories/` : Button, Header, Page) sont supprimés.
- **`.storybook/preview.tsx`** charge les mêmes polices et le même CSS que l'app, et entoure chaque story d'un `MemoryRouter`, puisque la carte contient des `<Link>`. Le panneau d'accessibilité (axe-core, le même moteur que nos tests e2e) scanne chaque story, et `a11y: { test: 'error' }` compte une violation comme un échec.
- **`src/features/products/ProductCard.stories.tsx`** : la carte en 3 états, avec un vrai produit du catalogue écrit à la main (une story n'appelle jamais la base). Une largeur de colonne de la grille donne à la carte ses proportions réelles.
  - **Standard**.
  - **Nom très long** : le titre passe sur deux lignes, le prix descend dessous sans sortir de la carte, le bouton reste en place.
  - **Épuisé** : statut « Épuisé », bouton désactivé (le même état que le test RTL).
- **Vérifié** sur le Storybook construit (`npm run build-storybook`) : les 3 stories s'affichent sans erreur, et axe ne trouve **aucune violation WCAG 2.1 AA**.
- **Commandes** : `npm run storybook` (http://localhost:6006) et `npm run build-storybook` (site statique dans `storybook-static/`, ignoré par Git et ESLint).
- **À quoi ça sert** : on voit et on vérifie chaque état d'un composant sans parcourir l'app ni avoir de données réelles. Ce catalogue peut ensuite servir de base au test-runner Storybook et à la régression visuelle.
