# TP « my-shop passe en production » : notes de jalons

Ce qu'a fait chaque jalon, les choix et leur raison, et les points de contrôle avec leur preuve. Les scripts SQL sont dans `supabase/`, à exécuter dans l'ordre dans le SQL Editor.

| Jalon | Commit | SQL |
|---|---|---|
| 1. Données sur Supabase | `5432a8d` `refactor: move data layer to supabase` | `01-schema.sql`, `02-seed-products.sql` |
| 2. Authentification | `cbc5e0d` `feat: auth and protected routes` | aucun (réglages Auth) |
| 3. Commander, mes commandes | `38fa2e3` `feat: checkout and my orders` | `03-orders-rls.sql` |
| 4. Espace admin | `0ceaa96` `feat: admin dashboard and catalog management` | `04-admin.sql` |
| Bonus | `a01edfd` tri / filtre / pagination serveur dans l'URL · `bb5dc73` export CSV | aucun |

---

## Jalon 1 : les données déménagent

- **Où lire les données** : `src/lib/supabase.ts` crée le client avec l'URL et la clé `anon` du `.env`. Les hooks `useProducts()` et `useProduct(slug)` de `src/hooks/useProducts.ts` lisent avec React Query, sous les clés `["products"]` et `["products", { slug }]`.
- **Nommage** : le type `Product` reprend les colonnes de la table (`image_url`, `in_stock`…). Le `as Product[]` dit donc vrai, et le formulaire admin écrit sans conversion.
- **URL** : `/products/:slug` plutôt que l'uuid : l'URL reste lisible et stable.
- **Cache** : plus de props transmises depuis `App`. La liste, le panier et le titre lisent le même cache, donc une seule requête. `staleTime` vaut 60 s : on ne recharge pas à chaque navigation.

**Point de contrôle 1.** « Pourquoi la clé anon peut-elle être publique ? Citez une chose que la RLS interdit déjà. »
- La clé anon identifie seulement le projet, avec le rôle `anon`. Elle se retrouve de toute façon dans le JS envoyé au navigateur. Ce n'est pas elle qui protège les données, ce sont les policies.
- La `service_role`, elle, contourne la RLS : elle ne sort jamais du serveur.
- Exemples de ce que la RLS interdit déjà :
  - un visiteur ne peut ni insérer, ni modifier, ni supprimer un produit : il n'y a pas de policy d'écriture, et l'insertion renvoie `42501 new row violates row-level security policy` ;
  - lire `orders` renvoie `[]`, faute de policy de lecture.

## Jalon 2 : l'authentification

- **La session** : `AuthContext.ts` contient le contexte et `useAuth`. `AuthProvider.tsx` fait un `getSession()` au démarrage, puis suit les changements avec `onAuthStateChange`. Les deux sont séparés parce que le fast refresh veut des fichiers `.tsx` qui n'exportent que des composants.
- **`booted`** : tant que la session stockée n'a pas été lue, on n'affiche ni la redirection ni « Connexion ». C'est le correctif « sans clignotement ».
- **Un seul `AuthPage`** pour `/login` et `/signup` : deux modes, et les erreurs Supabase affichées telles quelles. Quand une session existe, `<Navigate to={from}>` renvoie vers la page demandée (bonus `state.from`).
- **`ProtectedRoute`** : attend `booted`, puis redirige vers `/login` en mémorisant `from`.

**Point de contrôle 2.** « Pourquoi la session dans un Context plutôt que dans l'URL ? Plutôt que dans Zustand ? »
- **Pas l'URL** : la session contient un jeton secret. Il fuirait dans l'historique, les logs, et à chaque lien partagé. L'URL, c'est pour l'état qu'on veut partager, comme les filtres ou la page.
- **Pas Zustand** :
  - la session n'est pas un état qu'on fabrique : c'est le SDK Supabase qui la stocke, la rafraîchit et la synchronise entre onglets ; le Context ne fait que l'exposer ;
  - elle change rarement, donc le défaut du Context (tous ses lecteurs se redessinent à chaque changement) ne coûte presque rien ;
  - et ça n'ajoute aucune dépendance.

## Jalon 3 : commander, mes commandes

- **Panier** : il passe dans un store Zustand (`src/features/cart/store.ts`), qui réutilise le reducer pur `applyAction`. Chaque composant lit sa part du panier avec un sélecteur. Mesure : **12 rendus de `ProductCard` par ajout au panier avant, 0 après** (voir `AUDIT.md` § 6).
- **Commande** : la mutation `usePlaceOrder` insère la commande, puis ses lignes. Ces deux insertions ne sont pas atomiques, c'est la simplification acceptée par le TP. En cas de succès, elle invalide `["orders"]` et vide le panier.
- **`/account`** : la lecture utilise le select imbriqué `order_items(quantity, products(name, price))` pour afficher le détail et le total.
- **`userId` dans la clé** `["orders", userId]` : c'est une entrée de cache par utilisateur, **pas** un filtre de sécurité.

**Point de contrôle 3.** « A peut-il lire les commandes de B en trifouillant le front ? » Non, et la preuve est dans la base : les policies `read own orders` / `insert own orders` / `read own order items` / `insert own order items` de `03-orders-rls.sql`. Testé avec les jetons de deux comptes :

| Tentative de A | Réponse de la base |
|---|---|
| Lire les commandes | `[]` (B ne voit que les siennes) |
| Lire la commande de B par son id / ses lignes | `[]` |
| Créer une commande au nom de B | `42501 new row violates row-level security policy for table "orders"` |
| Ajouter une ligne à la commande de B | `42501` sur `order_items` |
| Modifier la commande de B | 0 ligne (aucune policy de modification) |

## Jalon 4 : l'espace admin

- **Le rôle** : il vit dans la table `profiles`, créée automatiquement à l'inscription par un trigger (bonus). Il n'y a aucune policy d'insertion ni de modification sur `profiles` : personne ne peut se nommer admin depuis le front.
- **`is_admin()`** est une fonction `security definer`, donc elle lit `profiles` sans passer par sa RLS. On l'écrit une fois et on la réutilise dans chaque policy admin. Elle évite surtout une **récursion infinie** : la policy « l'admin lit tous les profils » interroge `profiles` depuis une policy de `profiles`.
- **Correctif du jalon 3** : la policy d'insertion exige maintenant `status = 'pending'`. Avant, un client pouvait créer une commande déjà « payée ».
- **Garde front** : `AdminRoute`, c'est `ProtectedRoute` plus une vérification du rôle, avec une page 403. Le lien « Admin » n'apparaît que pour l'admin. C'est du confort, pas de la sécurité.
- **Composants réutilisables** :
  - `DataTable` : une vraie `<table>` avec `caption` et `th scope`, utilisée pour les produits et pour les commandes ;
  - `Modal` : le `<dialog>` natif, qui gère seul le piège du focus, Échap et le retour du focus ;
  - `ConfirmDialog`, construit sur `Modal` ;
  - `ProductForm`, le même formulaire pour la création et l'édition.
- **Les écritures** sont des mutations qui invalident `["products"]`. Ce préfixe couvre aussi `["products", { slug }]` et les pages du catalogue.
- **Écriture refusée** : quand la RLS refuse un `update` ou un `delete`, ça ne renvoie **pas d'erreur**, juste 0 ligne. `.select()` récupère les lignes touchées, et 0 ligne est affiché comme une erreur.
- **« Mes commandes » chez l'admin** : la policy admin lui renvoie toutes les commandes. D'où le `.eq('user_id', …)` dans `useMyOrders` : il donne son sens à « mes » commandes, ce n'est pas lui qui protège.
- **Déconnexion** : `queryClient.clear()`, pour qu'aucune donnée du compte précédent ne reste en mémoire.

**Point de contrôle 4.** « Montrez ce qui se passe côté base si un non-admin tente d'insérer un produit. » Dans le SQL Editor, on se fait passer pour le client : l'éditeur tourne en `postgres`, qui contourne la RLS. On remplace l'uuid par celui d'un compte non-admin (Authentication > Users). *Ce script n'a pas encore été exécuté : le tester une fois avant l'oral.*

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub": "UUID-DU-CLIENT", "role": "authenticated"}';
insert into products (slug, name, price) values ('hack', 'Hack', 1);
-- ERROR: 42501: new row violates row-level security policy for table "products"
rollback;
```

Mesuré aussi avec le jeton d'un client :
- insérer un produit est **refusé** (`42501`) ;
- changer un prix ou supprimer un produit touche **0 ligne** ;
- se nommer admin touche 0 ligne ;
- commander « déjà payé » est **refusé**.

---

## Bonus

- **Tri, filtre et pagination côté serveur** sur `/products` : `.order()`, `.eq('category')`, `.range()` (4 produits par page) et `count: 'exact'` pour le nombre de pages. L'état vit dans l'URL (`?sort=price-desc&category=Textile&page=2`) : l'URL se partage et le bouton retour fonctionne. `keepPreviousData` garde la page affichée pendant le chargement de la suivante. Une page hors limites affiche une page vide au lieu d'une erreur 416.
- **Export CSV** des commandes côté admin. Il est généré dans le navigateur depuis le cache, sans requête. Séparateur `;` et BOM UTF-8, pour un Excel français.
- **Non fait, car il faut exécuter du SQL** :
  - une fonction `place_order` appelée par `supabase.rpc()`, pour une commande atomique avec des prix lus côté serveur ;
  - l'upload d'image avec Supabase Storage (bucket et policies).

## Ménage de fin de TP

Supprimer les comptes de test `myshop-claude-test-j2@mailinator.com` (client) et `myshop-claude-test-j3@mailinator.com` (admin) dans Authentication > Users. Leur profil est supprimé en cascade, et leurs commandes restent avec `user_id = null`.
