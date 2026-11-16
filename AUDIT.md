# Fiche d'audit — Performances, Accessibilité & Éco-conception

Projet : **Maison Moderne** (`my-shop`) · Pages auditées : **`/`** (accueil) et **`/products`** (catalogue)

Commits :

| Axe | Commit |
|---|---|
| Base auditée (« avant ») | `faf575a` |
| Performance | `75020a8` `perf: skeleton loading, responsive images, self-hosted fonts, route splitting` |
| Accessibilité | `4084688` `a11y: fix text contrast, label-in-name on cart link, drop redundant product image links` |
| Accessibilité (lecteur d'écran) | `9f76c6f` `a11y: semantic orders list, route change announcements and page titles` |
| Accessibilité (images) | `acf1577` `a11y: descriptive image alt text, hide decorative back arrow` |
| Éco-conception (CSS mort) | `360db06` `eco: remove dead Vite template CSS and unused variables` |
| Éco-conception | `234357e` `eco: add lightweight favicon, robots.txt, print styles, remove unused template assets` |

`npx tsc --noEmit` : ✅ aucune erreur.

---

## 1. Protocole de mesure

**Lighthouse 13.6 (CLI)**
- Build de production servi par `vite preview` (jamais le serveur de dev).
- Chrome lancé par le CLI, sans extension. Émulation mobile Lighthouse par défaut : réseau 4G lent simulé, CPU ×4.
- **3 passages par page et par version, on retient la médiane.** Lighthouse varie d'un passage à l'autre ; un passage unique de l'accueil « avant » avait par exemple donné Perf 99 / LCP 1,6 s / CLS 0, contre une médiane de 85 / 3,4 s / 0,161.
- « Avant » : commit `faf575a` rebuilt et servi sur le port 4174. « Après » : build final servi sur le port 4173.
- Rapports HTML (ouvrables dans un navigateur) : `lighthouse/final/{home,products}-{avant,apres}-run{1,2,3}.report.html`.

**GreenIT-Analysis (EcoIndex)**
- Extension Chrome, sur Mac (écran Retina), fenêtre desktop.
- DevTools ouvert, *Disable cache* coché, rechargement forcé (`Cmd+Shift+R`), aucun scroll, URL saisie directement (pas de navigation interne de la SPA).

---

## 2. Résultats Lighthouse (médianes de 3 passages)

### Accueil `/`

| | Avant | Après | Écart |
|---|---|---|---|
| **Performance** | 85 | **97** | +12 |
| **Accessibilité** | 95 | **100** | +5 |
| **Best Practices** | 96 | **100** | +4 |
| **SEO** | 92 | **100** | +8 |
| FCP | 1,6 s | **0,8 s** | −50 % |
| LCP | 3,4 s | **2,6 s** | −24 % |
| TBT | 0 ms | 0 ms | = |
| CLS | 0,161 | **0** | −100 % |
| Speed Index | 1,6 s | **0,8 s** | −50 % |
| Requêtes | 12 | **11** | −1 |
| Poids transféré | 362 Ko | **236 Ko** | −35 % |
| dont images | 169 Ko | **43 Ko** | −75 % |
| Domaines contactés | 4 | **2** | −2 |

### Catalogue `/products`

| | Avant | Après | Écart |
|---|---|---|---|
| **Performance** | 73 | **97** | +24 |
| **Accessibilité** | 95 | **100** | +5 |
| **Best Practices** | 96 | **100** | +4 |
| **SEO** | 92 | **100** | +8 |
| FCP | 1,6 s | **0,8 s** | −50 % |
| LCP | 3,8 s | **2,6 s** | −32 % |
| TBT | 0 ms | 0 ms | = |
| CLS | 0,367 | **0,016** | −96 % |
| Speed Index | 1,6 s | **0,8 s** | −50 % |
| Requêtes | 14 | **13** | −1 |
| Poids transféré | 490 Ko | **269 Ko** | −45 % |
| dont images | 297 Ko | **76 Ko** | −74 % |
| Domaines contactés | 4 | **2** | −2 |

### Bundle JS (build Vite)

| | Avant | Après |
|---|---|---|
| Bundle principal | 273,8 Ko (85,8 Ko gzip) | 270,5 Ko (85,4 Ko gzip) |
| Chunks à la demande | — | `OrdersPage` 0,9 Ko · `ProductDetailPage` 1,0 Ko · `NotFoundPage` 0,3 Ko (gzip) |

---

## 3. Résultats EcoIndex (GreenIT-Analysis, 1 mesure desktop)

| Page | | EcoIndex | Eau | GES | Requêtes | Poids | DOM |
|---|---|---|---|---|---|---|---|
| `/` | Avant | 87,65 (A) | 1,87 cl | 1,25 gCO2e | 12 | 371 Ko (576) | 130 |
| `/` | Après | 87,67 (A) | 1,87 cl | 1,25 gCO2e | **11** | 373 Ko (571) | 133 |
| `/products` | Avant | 85,99 (A) | 1,92 cl | 1,28 gCO2e | 14 | 502 Ko (707) | 154 |
| `/products` | Après | 86,01 (A) | 1,92 cl | 1,28 gCO2e | **13** | 505 Ko (703) | 157 |

**Lecture.** L'EcoIndex desktop bouge peu, alors que le poids mesuré par Lighthouse en mobile baisse de 35 à 45 %. La raison : les images sont désormais servies via `srcset`, à la taille réellement affichée.
- En mobile, une carte fait environ 180 px de large : le navigateur charge une image de 360 px au lieu de 900. C'est −75 % sur les images.
- Sur un écran desktop Retina, une carte fait environ 450 px, soit environ 900 px physiques : le navigateur choisit l'image de 960 px, l'équivalent de l'ancienne image de 900 px.

Le gain est donc réel là où l'image d'origine était surdimensionnée (mobile, desktop non Retina), et neutre sur desktop Retina. La requête en moins vient du favicon corrigé (404 supprimé). Le DOM gagne +3 éléments : ce sont les textes réservés aux lecteurs d'écran ajoutés par l'axe accessibilité.

---

## 4. Corrections appliquées et mesurées

### Performance (`perf:`)

| # | Correction | Problème constaté | Mesure avant → après |
|---|---|---|---|
| P1 | **Skeleton de chargement** (`ProductCardSkeleton`) : mêmes classes et structure que la vraie carte, texte transparent, `aria-hidden` | En mobile, la grille passait d'une ligne « Chargement… » à 6 cartes et poussait le panier (`aside#basket`) vers le bas | CLS `/products` 0,367 → **0,016** · CLS `/` 0,161 → **0** |
| P2 | **Images responsives** (`ProductImage`) : `srcset` 240 à 960 px + `sizes` calé sur le CSS, `q=75`, `fetchpriority="high"` sur la 1re image, `loading="lazy"` sur les autres, `preconnect` vers `images.unsplash.com` | Images Unsplash en `w=900` affichées en ~180 px ; image LCP sans priorité | Images `/products` 297 → **76 Ko** · `/` 169 → **43 Ko** · LCP `/products` 3,8 → **2,6 s** |
| P3 | **Polices auto-hébergées** (`@fontsource-variable/dm-sans`, `@fontsource-variable/fraunces`), mêmes fichiers variables qu'avant, `font-display: swap` | Le CSS Google Fonts (`@import`) bloquait le rendu | Temps de blocage du rendu ~950 → **150 ms** · FCP 1,6 → **0,8 s** · domaines 4 → **2** |
| P4 | **Code-splitting** (`React.lazy` + `Suspense`) des routes secondaires `/orders`, `/products/:id` et 404 ; `/` et `/products` restent dans le bundle principal pour ne pas ajouter de requête avant leur LCP | Toutes les pages étaient dans un bundle unique | Bundle principal 275,5 → 270,5 Ko (86,3 → 85,4 Ko gzip), mesuré juste avant et après le découpage · neutre sur les pages auditées (voir § 5) |

### Accessibilité (`a11y:`)

| # | Correction | Problème constaté | Mesure avant → après |
|---|---|---|---|
| A1 | **Contrastes** : `--muted` `#78817b` → `#676f6a`, pastille du logo `#d7654d` → `#bc5843` | Texte gris à 3,53:1 et 3,98:1, logo à 3,58:1 (minimum WCAG AA : 4,5:1) | 16 à 18 éléments en échec → **0** · nouveaux ratios 5,13:1 / 4,55:1 / 4,55:1 |
| A2 | **Liens image produit redondants** : `aria-hidden="true"` + `tabIndex={-1}` (le lien du titre reste le lien accessible) | `aria-label="Voir {nom}"` ne contenait pas le texte visible des badges (WCAG 2.5.3) ; 2 liens identiques par carte | 6 échecs `label-content-name-mismatch` → **0** · 1 arrêt de tabulation en moins par carte |
| A3 | **Lien panier** : nom calculé depuis le contenu (« Panier 0 article(s) »), « article(s) » en `.sr-only` ; sous 390 px, « Panier » est masqué visuellement au lieu de `display: none` | `aria-label` différent du texte visible ; sur petit écran, le nom ne contenait plus « Panier » | Échec → **conforme** |

| A4 | **Page Commandes structurée** : liste `<ul>` des commandes, paires `<dl>` libellé/valeur (« Client, camille@… »), libellé « Statut » réservé aux lecteurs d'écran, `<h2>` masqués visuellement « Résumé des commandes » et « Liste des commandes », résumé en `<section>` titrée. Apparence inchangée | Test **VoiceOver** : la page était lue comme un bloc de texte continu, sans liste, sans titre après le `h1` ni association libellé/valeur. L'`aria-label` posé sur une simple `<div>` était ignoré. Lighthouse ne le détectait pas (100) | VoiceOver : « liste, 4 éléments », 3 titres dans le rotor, paires lues ensemble · audits `list`, `listitem`, `definition-list`, `dlitem` ✅ |
| A5 | **Navigation SPA annoncée** (`RouteAnnouncer`) : `document.title` propre à chaque route (« Commandes — maison moderne », nom du produit…) et région `aria-live="polite"` qui annonce la nouvelle page | Un changement de page côté client ne recharge rien : VoiceOver n'annonçait rien et le titre d'onglet était identique partout (WCAG 2.4.2, 4.1.3) | Titre distinct sur les 5 routes · annonce « Commandes » vérifiée avec VoiceOver |
| A6 | **`alt` descriptifs** : champ `imageAlt` dans `products.json`, qui décrit ce que montre réellement la photo (« Tasse blanche aux formes arrondies posée sur une table blanche »), avec le nom du produit en repli. Flèche de « ← Retour à la boutique » en `aria-hidden` | L'`alt` répétait le nom du produit, déjà lu dans le `h1` de la fiche (« Lampe Aria », puis « Lampe Aria, image »), sans rien dire de la photo. VoiceOver lisait « flèche gauche » | Audit `image-alt` ✅ (déjà conforme avant, mais l'alt n'apportait rien) · plus de redondance titre/image |

Score accessibilité : **95 → 100** sur les deux pages ; 100 aussi sur `/orders`, la fiche produit et la 404, en mobile et en desktop. Un lint statique `eslint-plugin-jsx-a11y` (règles *strict*) ne remonte aucune erreur.

Effet de bord corrigé : sur `/orders`, l'écran d'attente du code-splitting (100vh), puis la page en cours de chargement, plus courte, faisaient remonter puis redescendre le pied de page (CLS mobile 0,11 sur 2 passages sur 3). `.orders-page` fait désormais au moins 100vh : **CLS 0 sur 3 passages**.

Contrôles manuels :
- test au clavier : `Tab` ne parcourt que les éléments interactifs (liens, boutons). Le contenu textuel se lit avec les commandes du lecteur d'écran (`VO + →`, rotor), c'est le comportement attendu ;
- tous les `onClick` sont sur des `<button>` ;
- aucun formulaire, donc aucun `label`/`htmlFor` à vérifier ;
- un seul `<h1>` par page ;
- focus visible (`:focus-visible`) déjà présent.

### Éco-conception (`eco:`)

| # | Correction | Problème constaté | Mesure avant → après |
|---|---|---|---|
| E1 | **Favicon** : `<link rel="icon">` explicite + icône SVG de la marque | `GET /favicon.ico` en **404** à chaque visite ; `favicon.svg` = logo Vite de 9,5 Ko jamais utilisé | Requêtes en erreur 1 → **0** · icône 239 o · requêtes 12 → 11 et 14 → 13 · Best Practices 96 → **100** |
| E2 | **`robots.txt`** | Le serveur renvoyait `index.html` (fallback SPA) | SEO 92 → **100** |
| E3 | **Styles d'impression** (`@media print`) : navigation, panier, images, boutons et animations masqués | Bonne pratique GreenIT « Fournir une print css » absente | Intégrés au CSS existant plutôt qu'en fichier séparé, pour ne pas ajouter de requête |
| E4 | **Suppression des fichiers morts du template** : `icons.svg`, `hero.png`, `react.svg`, `vite.svg` | Fichiers jamais référencés ; `icons.svg` copié dans le build | −31 Ko dans le dépôt, −5 Ko dans le build déployé |
| E5 | **CSS mort supprimé** : bloc du template Vite dans `App.css` (`.counter`, `.hero`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks`), `.quantity-control`, `.detail-back-link`, variables du mode sombre du template, règles `code`/`.counter`, 7 variables CSS inutilisées. Les règles du template encore actives (police de base 18px/145 %, `font-synthesis`, `#root` en flex, styles par défaut des `h1`/`h2`) sont conservées | Environ 200 lignes de CSS sans aucun élément correspondant, téléchargées et analysées à chaque visite | CSS 19,7 → **16,4 Ko** (gzip 5,1 → **4,3 Ko**, −16 %) · **0,00 % de pixels différents** sur 8 captures (4 pages, en mobile et en desktop) |

Les exports TypeScript inutilisés (`describe`, `firstItem`, `applyEvent`, `carriers`, types `Create/UpdateProductInput`…) viennent des exercices de typage. Ils sont conservés : Vite les retire déjà du bundle (tree-shaking vérifié), donc les supprimer ne changerait rien pour le visiteur.

La plus grosse réduction de poids vient des corrections perf **P2** (images −75 %) et **P3** (2 domaines tiers en moins). Elles valent aussi pour l'axe éco.

---

## 5. Limites et pistes non retenues

- **LCP encore à 2,6 s.** L'image LCP n'est connue qu'après le JS puis le `fetch` de `products.json` : c'est la chaîne d'une SPA rendue côté client. Un `<link rel="preload">` sur `products.json` a été testé : la requête partait bien à 7 ms au lieu de 111 ms, mais sans gain mesurable sur le LCP. Il a été retiré. La vraie solution serait un rendu serveur ou statique (SSR/SSG).
- **42 Ko de JS « inutilisé ».** source-map-explorer montre qu'ils viennent de `react-dom` (203 Ko minifiés) et de `react-router` (37 Ko). Les pages ne pèsent que 6 Ko. Le code-splitting par route ne peut donc pas les supprimer, d'où un découpage limité aux routes secondaires (P4).
- **Images sur desktop Retina** (voir § 3). Plafonner le `srcset` à 720 px réduirait le poids mesuré par GreenIT, au prix d'images moins nettes : non retenu.
- **Cache HTTP (3/5 ressources) et HTTP/1.1.** Ces points relèvent de l'hébergement (en-têtes `Cache-Control`, HTTP/2), pas du code ; `vite preview` est un serveur local. Ils sont signalés, mais pas comptés comme corrections.
- **Photos incohérentes avec les fiches produit** (problème de contenu, hors code). « Tasse Atelier, émail vert profond » montre une tasse blanche ; « Lampe Aria, pied en céramique » montre un lampadaire en métal ; « Vase Sillage », « Plaid Nuage » et « Plateau Ligne » montrent des salons entiers. Les `alt` décrivent fidèlement les photos, mais il faudrait des visuels propres à chaque produit.
- **Pistes éco non appliquées.** Charger la police Fraunces sans l'axe de taille optique (`opsz`) ferait 67 → 37 Ko, soit −30 Ko par page, au prix d'un rendu un peu différent des grands titres. `products.json` est aussi chargé sur `/orders` sans y servir (1 requête, 1 Ko).
- **CLS résiduel de 0,016** sur `.shop-layout` (`/products`), déjà présent avant les corrections.
- **Première mesure écartée.** Le premier audit Lighthouse avait été fait sur le serveur de dev (`:5173`, React non minifié à 3,1 Mo, extensions Chrome actives). Il n'est pas représentatif et a été refait sur le build de production.
