# PROJECT_ANALYSIS.md — ENI Mail

> Audit initial du dépôt `F:\email` — **Phase 1 : Audit et analyse** avant tout développement.
> Date de l'audit : 2026-11-06.

---

## 1. Structure actuelle du dépôt

```
F:\email\
├── eni-mail-back\        Projet Spring Boot (squelette généré par Spring Initializr)
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd   Maven Wrapper 3.10.0
│   └── src\
│       ├── main\java\mg\eni\email\EmailApplication.java     (classe principale vide)
│       ├── main\resources\application.properties            (une seule ligne)
│       └── test\java\mg\eni\email\EmailApplicationTests.java (contextLoads vide)
└── eni-mail-frontend\    Projet Vite + React + TypeScript (template de démarrage)
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig*.json
    ├── index.html
    └── src\
        ├── App.tsx       Page d'accueil du template Vite
        ├── main.tsx
        ├── App.css / index.css
        └── assets\ (logos Vite/React/hero)
```

Le dépôt ne contient **aucun code métier**. Les deux projets sont des squelettes générés sans ligne applicative.

---

## 2. État du frontend

### Technologies installées (`package.json`)

| Catégorie | Lib | Version | Statut |
|-----------|-----|---------|--------|
| Runtime | react / react-dom | ^19.3.1 | **Divergence** : le cahier des charges demande React 18 |
| Routage | react-router-dom | ^7.18.5 | OK |
| HTTP | axios | ^1.21.0 | OK (version ancienne — à monter en ^1.7) |
| Data | @tanstack/react-query | ^5.106.1 | Utile, non exigé |
| Styling | tailwindcss + @tailwindcss/vite | ^4.3.4 | OK (Tailwind v4 — pas de `tailwind.config.js`) |
| Build | vite | ^8.3.6 | OK |
| TypeScript | typescript | ~6.0.3 | OK |
| Lint | eslint + typescript-eslint | ^10/^8 | OK |
| React Compiler | babel-plugin-react-compiler | ^1.0.0 | Activé (via `@rolldown/plugin-babel`) |

### Dépendances **manquantes** par rapport au cahier des charges

- `react-hook-form` — formulaires.
- `zod` + `@hookform/resolvers` — validation.
- `lucide-react` — icônes.
- Librairie de toast (**`sonner`** recommandé, ou `react-hot-toast`).
- Librairie de dates (**`date-fns`** recommandé, ou `dayjs`).
- `clsx` + `tailwind-merge` pour le compose de classes.

### Code existant

- `src/App.tsx` : écran de démarrage Vite avec compteur et liens vers vite.dev — **à remplacer entièrement**.
- `src/index.css` / `src/App.css` : styles du template.
- Aucune directive Tailwind (`@import "tailwindcss";`) détectée — à ajouter.
- Aucun routeur configuré, aucune route protégée, aucun service API.

---

## 3. État du backend

### `pom.xml` — points saillants

| Élément | Valeur | Observation |
|---------|--------|-------------|
| `spring-boot-starter-parent` | **4.1.2** | **Divergence** : spec demande Spring Boot 3.x. Spring Boot 4 est très récent (fin 2025), BOM et JJWT compatibles à vérifier. |
| `java.version` | 17 | OK (JDK 21 installé, cible 17 compatible) |
| `spring-boot-starter-webmvc` | — | Nom renommé en Spring Boot 4 (ex-`spring-boot-starter-web`). |
| `spring-boot-starter-security` | — | OK |
| `spring-boot-starter-data-mongodb` | — | OK |
| `spring-boot-starter-validation` | — | OK |
| Lombok | — | OK (annotation processor configuré) |
| JWT (jjwt / java-jwt) | **absent** | À ajouter : `io.jsonwebtoken:jjwt-api/-impl/-jackson:0.12.6`. |
| BCrypt | fourni par Spring Security | OK |
| spring-boot-starter-validation-test | — | **Artefact inexistant** à ma connaissance → à retirer (les validations sont couvertes par le starter-test normal). |

### Code existant

- `EmailApplication.java` : classe `@SpringBootApplication` minimale.
- `application.properties` : contient uniquement `spring.application.name=email`.
- Aucune configuration MongoDB (URI, base), aucune configuration Security, aucun endpoint, aucun DTO, aucune entité.

---

## 4. État de MongoDB

- **MongoDB n'est pas installé localement** (ni `mongod` ni `mongosh` dans le `PATH`).
- Docker Desktop est présent (`/c/Program Files/Docker/Docker/resources/bin` dans le PATH) → piste recommandée pour démarrer MongoDB rapidement :

```bash
docker run -d --name eni-mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=eni \
  -e MONGO_INITDB_ROOT_PASSWORD=change_me \
  mongo:7
```

Alternative : MongoDB Atlas (cluster gratuit) via chaîne de connexion dans `.env`.

---

## 5. Fonctionnalités déjà présentes vs. manquantes

| Module du cahier des charges | État |
|------------------------------|------|
| 1. Authentification (JWT, BCrypt, rôles, protection des routes) | **Rien** |
| 2. Gestion des utilisateurs (CRUD, rôles, filières, promotions) | **Rien** |
| 3. Messagerie (composer, répondre, transférer, états par destinataire…) | **Rien** |
| 4. Dossiers (Inbox, Sent, Drafts, Trash — compteurs, filtres, pagination) | **Rien** |
| 5. Pièces jointes (upload, MIME, tailles, téléchargement contrôlé) | **Rien** |
| 6. Groupes de diffusion (CRUD, membres, permissions) | **Rien** |
| 7. Recherche (objet, contenu, expéditeur, destinataire, pagination) | **Rien** |
| 8. Administration (dashboard, stats, gestion des comptes/rôles/groupes) | **Rien** |
| Design system / UI Gmail-like | **Rien** (template Vite) |
| Tests unitaires et d'intégration | **Rien** (seul `contextLoads` vide) |
| Documentation (UML, README, guide d'installation) | **Rien** |

**Conclusion** : tout est à construire sur un socle technique correctement initialisé.

---

## 6. Problèmes techniques détectés

### Critiques

1. **Spring Boot 4.1.2** est spécifié alors que le cahier des charges exige Spring Boot 3.x. Impacts :
   - Écosystème (JJWT, Testcontainers, starters tiers) encore majoritairement calé sur 3.x LTS.
   - Breaking changes connus en 4.0 (ex : noms de starters `web` → `webmvc`, Jakarta EE 11, Security 7.x).
   - **Recommandation** : revenir à **Spring Boot 3.3.x LTS** pour fiabilité et conformité au cahier des charges (`3.3.5` au moment de l'audit).
2. **`spring-boot-starter-validation-test`** inexistant → la compilation des tests échouera.
3. **JWT absent** du `pom.xml`.
4. **React 19** est installé alors que le cahier des charges demande React 18. React 19 étant stable et rétrocompatible avec la majorité de l'écosystème, deux options :
   - (A) Rester en React 19 et documenter la décision (gain : React Compiler natif).
   - (B) Rétrograder à React 18.3.x (strict respect du CDC).
5. **Aucune configuration MongoDB** (URI, base, authentification) dans `application.properties`.
6. **CORS non configuré** — indispensable pour le dialogue front (port 5173) ↔ back (port 8080).
7. **Variables d'environnement absentes** (`.env`, `.env.example`, profils Spring `application-dev.yml` / `application-prod.yml`).

### Moyens

8. Axios en `^1.21.0` est très ancien — monter à `^1.7.x`.
9. Pas de `tailwind.config.js` ni `postcss.config.js` — Tailwind v4 fonctionne via plugin Vite, mais il faut un `@import "tailwindcss";` dans `index.css` + les tokens de design.
10. React Compiler activé via Babel — potentiellement incompatible avec certaines libs (ex: react-hook-form < v8). À vérifier au moment de l'ajout.
11. `tsconfig.app.json` active `verbatimModuleSyntax` et `erasableSyntaxOnly` — règles strictes (bien, mais à connaître).
12. Pas de Git initialisé (`git status` indique "not a git repository").

### Mineurs

13. Lombok à conserver (annotation processor déjà configuré).
14. `spring-boot-devtools` présent → OK pour dev, à exclure en prod.
15. `README.md` du front = template Vite — à remplacer.

---

## 7. Architecture cible recommandée

### Backend — packages Spring Boot

```
mg.eni.email
├── EmailApplication.java
├── config
│   ├── SecurityConfig.java          @EnableWebSecurity
│   ├── CorsConfig.java
│   ├── MongoConfig.java             index creation, auditing
│   ├── JwtProperties.java           @ConfigurationProperties
│   └── OpenApiConfig.java           (optionnel, springdoc)
├── security
│   ├── JwtService.java
│   ├── JwtAuthenticationFilter.java
│   ├── CustomUserDetailsService.java
│   └── RateLimitingFilter.java      (brute-force login)
├── controller
│   ├── AuthController.java
│   ├── UserController.java
│   ├── MessageController.java
│   ├── FolderController.java
│   ├── AttachmentController.java
│   ├── GroupController.java
│   ├── SearchController.java
│   └── AdminController.java
├── service
│   ├── AuthService.java
│   ├── UserService.java
│   ├── MessageService.java
│   ├── AttachmentService.java
│   ├── GroupService.java
│   ├── SearchService.java
│   └── AdminStatsService.java
├── repository
│   ├── UserRepository.java
│   ├── MessageRepository.java
│   ├── GroupRepository.java
│   └── AttachmentRepository.java
├── document                         (entités MongoDB)
│   ├── User.java
│   ├── Message.java
│   ├── MessageRecipient.java        (sous-document)
│   ├── Attachment.java
│   └── Group.java
├── dto
│   ├── request  (LoginRequest, CreateMessageRequest, …)
│   └── response (UserDto, MessageDto, FolderSummaryDto, …)
├── mapper                           (MapStruct ou mappers manuels)
├── enums
│   ├── Role.java
│   ├── MessageFolder.java           INBOX, SENT, DRAFT, TRASH
│   └── AccountStatus.java
├── exception
│   ├── GlobalExceptionHandler.java  @RestControllerAdvice
│   ├── BusinessException.java
│   ├── ResourceNotFoundException.java
│   └── ForbiddenException.java
├── validation                       (contraintes custom)
└── util
```

### Modélisation MongoDB (indicative)

#### Collection `users`
```json
{
  "_id": "ObjectId",
  "email": "unique index",
  "passwordHash": "string",
  "firstName": "string", "lastName": "string",
  "role": "ROLE_ETUDIANT | ROLE_ENSEIGNANT | ROLE_ADMIN",
  "filiere": "string", "promotion": "string",
  "avatarUrl": "string?",
  "status": "ACTIVE | DISABLED",
  "createdAt": "date", "updatedAt": "date"
}
```
Index : `{ email: 1 } unique`, `{ role: 1 }`, `{ filiere: 1, promotion: 1 }`, text index sur `firstName lastName email`.

#### Collection `messages`
```json
{
  "_id": "ObjectId",
  "senderId": "ObjectId → users",
  "subject": "string", "body": "string",
  "recipients": [
    {
      "userId": "ObjectId",
      "type": "TO | CC | BCC",
      "read": false, "readAt": null,
      "folder": "INBOX | TRASH",
      "deleted": false, "deletedAt": null
    }
  ],
  "senderFolder": "SENT | DRAFT | TRASH",
  "senderDeleted": false, "senderDeletedAt": null,
  "isDraft": true,
  "parentMessageId": "ObjectId?",
  "threadId": "ObjectId?",            // identifiant de conversation
  "attachmentIds": ["ObjectId"],
  "groupIds": ["ObjectId"],           // traçabilité des groupes résolus
  "createdAt": "date", "sentAt": "date?"
}
```
Index composés :
- `{ "recipients.userId": 1, "recipients.folder": 1, "sentAt": -1 }`
- `{ senderId: 1, senderFolder: 1, sentAt: -1 }`
- `{ threadId: 1, createdAt: 1 }`
- Index texte sur `subject` + `body`.

**Justification** : embarquer `recipients[]` dans le message permet un état lu/supprimé par destinataire sans table de liaison séparée, et des requêtes paginées efficaces sur la boîte de réception d'un utilisateur. La suppression par un destinataire ne retire pas le message pour les autres (réalisé via `recipients.$.deleted`). Les pièces jointes sont référencées (pas embarquées) pour pouvoir servir leur contenu en streaming.

#### Collection `groups`
```json
{
  "_id": "ObjectId",
  "name": "string unique",
  "description": "string",
  "memberIds": ["ObjectId"],
  "createdBy": "ObjectId",
  "createdAt": "date", "updatedAt": "date"
}
```

#### Collection `attachments`
```json
{
  "_id": "ObjectId",
  "messageId": "ObjectId?",
  "ownerId": "ObjectId",              // propriétaire (expéditeur)
  "filename": "string",               // nom affiché
  "storedName": "string",             // UUID + extension (sur disque)
  "contentType": "string",
  "size": "long",
  "createdAt": "date"
}
```
Les fichiers physiques résident hors du dépôt, dans un dossier configurable (`app.attachments.path`). URL de téléchargement : `/api/attachments/{id}` — contrôle d'accès obligatoire (expéditeur OU destinataire OU admin).

#### Collection `refresh_tokens` (si refresh JWT choisi)
```json
{ "_id":"ObjectId", "userId":"ObjectId", "tokenHash":"string",
  "expiresAt":"date", "revoked":false, "createdAt":"date" }
```

### Frontend — organisation

```
src/
├── main.tsx
├── App.tsx                  (providers + router)
├── routes/
│   ├── AppRoutes.tsx
│   ├── ProtectedRoute.tsx
│   └── AdminRoute.tsx
├── layouts/
│   ├── AuthLayout.tsx       (pages publiques)
│   └── AppLayout.tsx        (sidebar + topbar + outlet)
├── features/
│   ├── auth/                (LoginPage, hooks, service)
│   ├── mail/                (InboxPage, MessageView, Compose, folders)
│   ├── users/               (UserProfile, etc.)
│   ├── groups/              (GroupListPage, GroupEditor)
│   └── admin/               (DashboardPage, UserAdmin, GroupAdmin)
├── components/              (Button, Input, Modal, Toast, EmptyState, Pagination, Avatar…)
├── hooks/                   (useAuth, useDebounce, useFolderCounts…)
├── contexts/                (AuthContext)
├── stores/                  (optionnel : zustand pour UI state)
├── services/                (api.ts axios instance, authService, mailService, …)
├── types/                   (User, Message, Group, ApiError…)
├── utils/                   (date, formatSize, validators zod partagés)
└── assets/
```

### Endpoints REST cibles (résumé)

```
POST   /api/auth/login                   → JWT access (+ refresh optionnel)
POST   /api/auth/logout                  → révocation refresh
POST   /api/auth/refresh                 → renouvellement access
GET    /api/users/me                     → profil courant
PATCH  /api/users/me                     → mise à jour profil
GET    /api/users                        → liste (admin ou recherche destinataires)
POST   /api/users                        → création (admin)
PATCH  /api/users/{id}                   → édition (admin)
DELETE /api/users/{id}                   → désactivation (admin)

GET    /api/messages?folder=INBOX&page=  → liste paginée d'un dossier
GET    /api/messages/{id}                → détail (vérif accès)
POST   /api/messages                     → envoi
POST   /api/messages/{id}/reply          → réponse
POST   /api/messages/{id}/reply-all      → réponse à tous
POST   /api/messages/{id}/forward        → transfert
PATCH  /api/messages/{id}/read           → marquer lu/non-lu
DELETE /api/messages/{id}                → suppression (déplacement Corbeille)
POST   /api/messages/{id}/restore        → restauration
DELETE /api/messages/{id}/permanent      → suppression définitive

GET    /api/drafts                       → brouillons
POST   /api/drafts                       → créer / mettre à jour un brouillon

GET    /api/folders/counts               → compteurs non-lus/total par dossier
GET    /api/search?q=&scope=&page=       → recherche filtrée par droits

POST   /api/attachments                  → upload multipart
GET    /api/attachments/{id}             → téléchargement contrôlé
DELETE /api/attachments/{id}             → suppression (brouillon)

GET    /api/groups                       → liste des groupes visibles
POST   /api/groups                       → création (admin/enseignant)
PATCH  /api/groups/{id}                  → édition
DELETE /api/groups/{id}                  → suppression
POST   /api/groups/{id}/members          → ajout membres
DELETE /api/groups/{id}/members/{uid}    → retrait

GET    /api/admin/stats                  → indicateurs tableau de bord
GET    /api/admin/users                  → liste admin (filtres)
```

---

## 8. Plan de développement détaillé

Le plan suit les phases imposées par le cahier des charges. Chaque étape se conclut par des contrôles (compilation + tests + manipulation manuelle du module).

### Étape 0 — Préparation de l'environnement (1 petit lot)
- **0.1** Décider : Spring Boot 3.3.x LTS ou 4.1.x ? (**recommandation : 3.3.x**).
- **0.2** Décider : React 19 ou retour à 18 ? (**recommandation : 19 — gain de perf, lib compatibles**).
- **0.3** Installer MongoDB (Docker) ou configurer une URI Atlas.
- **0.4** `git init` + `.gitignore` (exclure `.env`, `uploads/`).

### Étape 1 — Fondations backend
- **1.1** Corriger `pom.xml` (retrait de `-validation-test`, ajout JJWT, downgrade Spring Boot si décidé).
- **1.2** Profils : `application.yml`, `application-dev.yml`, `application-prod.yml`, `.env.example`.
- **1.3** `GlobalExceptionHandler`, enum `Role`, `MessageFolder`, config JWT.
- **1.4** Entité `User`, repository, seed d'un admin initial via `CommandLineRunner`.
- **1.5** `SecurityConfig` + `JwtAuthenticationFilter` + endpoint `/api/auth/login`.
- **1.6** CORS vers `http://localhost:5173`.
- **1.7** Tests : AuthController, JwtService, UserService (unitaires + MockMvc).

### Étape 2 — Utilisateurs & profil
- CRUD users (admin), `/users/me`, rôles.
- Tests autorisation (étudiant ne peut pas s'auto-promouvoir admin).

### Étape 3 — Messages (cœur)
- Entité `Message` + `MessageRecipient` embarqué.
- Envoi, listing par dossier (pagination), détail, marquage lu, suppression/restauration, suppression définitive.
- Tests d'intégration des règles clés (suppression individuelle, compteurs non-lus, accès).

### Étape 4 — Brouillons, réponse, réponse à tous, transfert, thread
- Gestion de `parentMessageId`/`threadId`.

### Étape 5 — Pièces jointes
- Upload multipart, validation MIME + taille, stockage disque avec nom UUID, endpoint de téléchargement sécurisé.

### Étape 6 — Groupes
- CRUD + membres + permissions + expansion en destinataires lors d'un envoi.

### Étape 7 — Recherche + indexation
- Index texte MongoDB, endpoint paginé, filtres par dossier/expéditeur.

### Étape 8 — Administration & stats
- Agrégations MongoDB (counts par rôle, messages/jour, groupes).

### Étape 9 — Fondations frontend
- Nettoyer template Vite, installer `react-hook-form`, `zod`, `lucide-react`, `sonner`, `date-fns`, `clsx`, `tailwind-merge`.
- Configurer Tailwind v4 (tokens, dark mode off, palette institutionnelle), design system minimal.
- Router + `AppLayout` + `AuthContext` (stockage JWT en mémoire + refresh cookie HttpOnly si retenu).

### Étape 10 — Pages frontend (dans l'ordre de livraison incrémentale)
- Login → Layout → Inbox → MessageView → Compose → Sent → Drafts → Trash → Groupes → Profil → Admin Dashboard → Admin Users → Admin Groups → 404.

### Étape 11 — Intégration front/back
- Service API Axios + intercepteur 401 → refresh → retry.
- Gestion globale erreurs (toast).
- Validation Zod partagée.

### Étape 12 — Tests, documentation, livrables
- Tests d'intégration end-to-end (scénarios 1 à 10 du CDC).
- Diagrammes UML (Mermaid/PlantUML), README racine, documentation d'installation, données de démonstration, comptes de test par rôle, script d'initialisation.

---

## 9. Risques techniques et mesures de prévention

| # | Risque | Mitigation |
|---|--------|------------|
| 1 | Spring Boot 4.1.2 trop récent → libs tierces non à jour | Revenir à 3.3.x LTS (recommandé) ou verrouiller les versions testées une par une. |
| 2 | Spring Security 7 (SB4) — API différente de la 6 | Si on reste en 4.x : utiliser la nouvelle configuration `SecurityFilterChain` + `authorizeHttpRequests`. |
| 3 | React 19 + React Compiler + lib peu matures | Installer les libs manquantes puis lancer `vite build` tôt pour détecter les incompatibilités. |
| 4 | Fuite d'autorisation (un user lit les messages d'un autre) | Tous les accès `/messages/{id}` vérifient `senderId == me || me in recipients[].userId` côté service. Tests dédiés. |
| 5 | Upload de fichier malveillant (exécutable, path traversal) | Liste blanche d'extensions + vérification MIME réel via `Files.probeContentType` et `Tika` si besoin ; nom de fichier remplacé par UUID ; chemin résolu et normalisé puis assertion `startsWith(root)`. |
| 6 | DoS via upload/attachments | Limite 5 Mo/fichier + `spring.servlet.multipart.max-request-size`, limiter nb pièces jointes par message. |
| 7 | Brute-force sur `/auth/login` | Filtre de rate-limit (Bucket4j) + verrouillage temporaire après N tentatives. |
| 8 | Fuite du mot de passe haché dans réponses API | Mappers DTO explicites, jamais d'entité `User` sérialisée directement. |
| 9 | Perte du JWT côté front (XSS) | Préférer refresh en cookie HttpOnly+Secure+SameSite=Lax, access en mémoire ; CSP stricte ; pas de `dangerouslySetInnerHTML`. |
| 10 | Requêtes N+1 (destinataires → users) | Projection + agrégation `$lookup` pour résoudre en une requête ; limiter les champs renvoyés. |
| 11 | Spam d'envoi à un groupe où l'utilisateur figure plusieurs fois | Dédoublonnage par `userId` lors de l'expansion des groupes/destinataires. |
| 12 | Divergence de validation front/back | Schémas Zod côté front **ET** validation Jakarta côté back — la source de vérité reste le back. |
| 13 | Pas de HTTPS en prod | Documenter que le déploiement doit passer par un reverse proxy TLS (Nginx/Caddy). |
| 14 | Secrets commités (JWT secret, MongoDB URI) | `.env` dans `.gitignore`, `.env.example` publié sans valeurs ; configuration Spring via `${JWT_SECRET}`. |
| 15 | Index MongoDB manquants = lenteurs | Déclarer les index via `@Indexed` ou `MongoTemplate.indexOps()` au démarrage. |

---

## 10. Décisions à trancher avant la Phase 2

| # | Question | Option A | Option B | Reco |
|---|----------|----------|----------|------|
| D1 | Version Spring Boot | 3.3.x LTS | 4.1.2 (actuel) | **A** (conformité CDC, écosystème mûr) |
| D2 | Version React | 19.x (actuel) | 18.3.x | **A** (gain perf, compat OK) |
| D3 | Stockage du JWT côté front | Cookie HttpOnly (refresh) + access en mémoire | `localStorage` | **A** (XSS-résistant) |
| D4 | Base MongoDB | Docker local | MongoDB Atlas gratuit | **A** pour le dev, **B** possible pour la démo |
| D5 | Refresh token | Oui (cookie) | Non (access long + logout côté front) | **A** (sécurité, UX) |
| D6 | Librairie de toast | `sonner` | `react-hot-toast` | **A** (API moderne, accessible) |
| D7 | Librairie de dates | `date-fns` | `dayjs` | **A** (tree-shaking, locale FR) |
| D8 | Gestion d'état front | React Query seul + Context Auth | + Zustand pour UI | **A** (suffisant pour ce périmètre) |
| D9 | Schéma destinataires | Embarqué dans `messages.recipients[]` | Collection dédiée `message_recipients` | **A** (lectures boîte de réception efficaces, suppression par destinataire simple) |
| D10 | Mapping DTO | MapStruct | Manuel | **B** (projet pédagogique, pas besoin d'alourdir la toolchain) |

---

## 11. Prochaines étapes (ordre de réalisation)

1. **Valider les décisions D1–D10** ci-dessus (ou me laisser appliquer les recommandations par défaut).
2. Passer en **Phase 2 — Conception** : diagrammes UML (cas d'utilisation, classes, séquences), schéma des endpoints détaillé, règles métier précises.
3. Entamer **Phase 3 — Développement backend** par les Étapes 0 à 2 (environnement + fondations + authentification + utilisateurs), avec tests.
4. Enchaîner Étapes 3 à 8 (messages, dossiers, pièces jointes, groupes, recherche, admin).
5. **Phase 4 — Développement frontend** (Étapes 9 à 11) une fois le backend stable.
6. **Phase 5 — Intégration** et **Phase 6 — Tests & finalisation** (livrables documentaires).

À chaque étape, je produirai : fichiers créés/modifiés, commandes exécutées, résultats des tests, prochaine étape.

---
