# Maison Moderne

Boutique de démonstration construite avec React et TypeScript strict. Le catalogue est servi par Supabase (Postgres + RLS), lu avec React Query. Copier `.env.example` en `.env` et exécuter les scripts de `supabase/` dans l'ordre (SQL Editor). Authentification Supabase (email + mot de passe), commandes par client et espace admin (`/admin`) protégés par les policies RLS.

## Démarrer

```sh
npm install
npm run dev
```

## Parcours disponibles

- `/` : accueil et sélection de produits
- `/products` : catalogue (tri, catégorie et page dans l'URL : `?sort=price-desc&category=Textile&page=2`)
- `/products/:slug` : détail d'un produit
- `/login`, `/signup` : connexion, inscription
- `/account` : mes commandes (connecté)
- `/admin`, `/admin/orders` : catalogue et commandes (admin)
- Toute autre URL : page 404

Le panier est partagé entre les pages pendant la session. Les routes utilisent React Router pour naviguer sans rechargement.

## Vérifier le projet

```sh
npm run typecheck   # tsc -b (le tsconfig racine ne fait que référencer les autres : « npx tsc --noEmit » n'y vérifie aucun fichier)
npm run lint
npm test            # Vitest : tests unitaires et de composants (src/**/*.test.ts[x])
npm run test:e2e    # Playwright : parcours et accessibilité dans un vrai navigateur (e2e/), lance le serveur de dev tout seul
npm run test:rls    # Sécurité de la base : les policies RLS testées sur le vrai Supabase (supabase/tests/)
npm run build
npm run storybook   # Catalogue des composants (http://localhost:6006), avec le panneau d'accessibilité
```

- **Tests unitaires** (Vitest) : la logique pure. Panier (`src/features/cart/cart.ts`) et état d'URL du catalogue (`src/features/products/catalogParams.ts`).
- **Tests de composants** (React Testing Library) : ce que l'utilisateur voit et fait (carte produit, page Produits, connexion). Supabase y est remplacé par un mock. Rendu sous les providers de l'app avec `renderWithProviders` (`src/test/utils.tsx`).
- **Tests e2e** (Playwright) : le parcours catalogue → panier sur le vrai Supabase, et la connexion. En cas d'échec : `npx playwright show-report` (capture, trace, DOM).
- **Accessibilité** (Playwright + axe-core) : 9 états de pages contrôlés en WCAG 2.1 AA, dont l'espace client et l'admin.
- **Sécurité RLS** (Vitest, hors de `npm test` car il faut le réseau) : ce que la base refuse à un visiteur et à un client, avec la clé publique seulement. Les écritures interdites visent un produit jetable : une policy cassée ne peut pas abîmer le vrai catalogue.
- Les tests connectés utilisent des **comptes de test** déclarés dans `.env` (`E2E_EMAIL`, `E2E_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, voir `.env.example`). Sans eux, ces tests sont ignorés.

Le mode strict est activé dans `tsconfig.app.json`. Les images du catalogue et les polices sont chargées en ligne.

## Couverture de tests

`npm run test:coverage`, puis ouvrir `coverage/index.html`. La couverture dit ce que les tests ont **exécuté**, pas ce qu'ils ont vérifié : elle sert à trouver les zones sans tests, ce n'est pas un objectif. Elle ne compte que Vitest, pas les parcours Playwright.

| Date | Lignes | Instructions | Branches | Fonctions | Tests |
|---|---|---|---|---|---|
| 17/11/2026 | **29,79 %** (104/349) | 30 % | 20,18 % | 26,66 % | 22 Vitest + 2 e2e |
| 17/11/2026, après les tests ajoutés | **30,85 %** (108/350) | 31,27 % | 20,18 % | 29,34 % | 26 Vitest + 11 e2e + 16 RLS |

**Test décidé à l'étape 4, puis écrit (commit `ad2b1bc`) : `orderTotal` dans `src/types/orders.ts`, alors couvert à 0 %.** Il était rouge dès sa création : le bug d'arrondi ci-dessous est corrigé.
- C'est de l'argent montré aux clients (`/account`), à l'admin (`/admin/orders`) et exporté en CSV.
- Le test de `computeCartTotal` a montré que JavaScript calcule mal les centimes, or `orderTotal` n'arrondit pas : avec un prix à 24,90 €, 3 tasses s'affichent « 74.69999999999999 € ». Ça ne se voit pas encore parce que tous les prix sont entiers, mais le formulaire admin accepte les centimes.
- C'est une fonction pure, donc un test en quelques millisecondes.

Le score bouge peu (+1 point) alors que la protection a beaucoup augmenté : l'accessibilité et la sécurité RLS sont testées hors de Vitest, donc hors de cette mesure. **Prochain candidat : `escapeCell` dans `src/lib/csv.ts`** : un `;` ou un guillemet dans un email ou un nom de produit décalerait les colonnes de l'export comptable.

Les autres fichiers à 0 % sont surtout de l'affichage (admin, détail produit) ou du branchement sur Supabase (`AuthProvider`, hooks), déjà traversé par les parcours e2e. La branche `applyDiscount` du reducer du panier n'est jamais déclenchée par l'app : c'est du code mort à supprimer plutôt qu'à tester.
