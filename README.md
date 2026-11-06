# ENI Mail

Plateforme de messagerie interne de l'École Nationale d'Informatique (ENI).

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS 4, React Router 7, React Query, React Hook Form + Zod, Lucide, sonner, date-fns |
| Backend | Java 17, Spring Boot 3.3 (Web MVC, Security, Validation, Data MongoDB), JJWT 0.12, Lombok |
| Base de données | MongoDB 7 |
| Authentification | JWT HS256 (access 15 min) + refresh token en **cookie HttpOnly + SameSite Lax** |
| Build | Maven Wrapper, npm |

---

## Arborescence

```
F:\email\
├── docker-compose.yml           Démarre MongoDB (+ mongo-express)
├── README.md                    Ce fichier
├── PROJECT_ANALYSIS.md          Audit initial du projet
├── docs/
│   ├── uml/                     Diagrammes Mermaid (cas d'utilisation, classes, séquences, archi)
│   ├── api/                     (reservé à la documentation OpenAPI)
│   └── user-guide/              Guide utilisateur
├── eni-mail-back/               Backend Spring Boot
└── eni-mail-frontend/           Frontend React + Vite
```

---

## Prérequis

- **Java 17+** (JDK 21 testé)
- **Node.js 20+** et **npm 10+**
- **Docker Desktop** (pour MongoDB) *ou* une instance MongoDB déjà installée
- Un navigateur moderne (Chrome, Firefox, Edge)

---

## Démarrage rapide

### 1. Base de données

```bash
# À la racine du projet
docker compose up -d
```

MongoDB écoute alors sur `localhost:27017`. L'interface d'administration `mongo-express` est disponible sur <http://localhost:8081> (login `admin`/`admin`).

Vérification :

```bash
docker compose ps
```

### 2. Backend

```bash
cd eni-mail-back
cp .env.example .env            # Puis adaptez JWT_SECRET et SEED_ADMIN_PASSWORD
./mvnw spring-boot:run
```

L'API démarre sur <http://localhost:8089>. Au premier démarrage, un jeu de données de démonstration est créé (voir plus bas).

> **Pourquoi 8089 et pas 8080 ?** Sur beaucoup de postes, le port 8080 est déjà occupé (Oracle REST, EnterpriseDB, Jenkins, Tomcat local, etc.). 8089 évite ce conflit. Pour forcer un autre port : `SERVER_PORT=8095 ./mvnw spring-boot:run`, et aligner le proxy frontend via `VITE_API_TARGET=http://localhost:8095 npm run dev`.

### 3. Frontend

```bash
cd eni-mail-frontend
npm install
npm run dev
```

L'interface est disponible sur <http://localhost:5173>. Les requêtes `/api/*` sont proxifiées vers le backend.

---

## Comptes de démonstration

Ces comptes sont créés automatiquement au premier démarrage du backend (seed).
**Changez ces mots de passe avant toute mise en production.**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@eni.mg` | `Admin@2026!` |
| Enseignant | `prof.rakoto@eni.mg` | `Prof@2026!` |
| Enseignant | `prof.rasolo@eni.mg` | `Prof@2026!` |
| Étudiant (M1 GLBD) | `etu.andria@eni.mg` | `Etu@2026!` |
| Étudiant (M1 GLBD) | `etu.ravelo@eni.mg` | `Etu@2026!` |
| Étudiant (M2 GLBD) | `etu.ramos@eni.mg` | `Etu@2026!` |
| Étudiant (L1) | `etu.rajao@eni.mg` | `Etu@2026!` |

---

## Variables d'environnement

Voir [`eni-mail-back/.env.example`](eni-mail-back/.env.example). Les principales :

| Variable | Rôle | Défaut |
|----------|------|--------|
| `SPRING_PROFILES_ACTIVE` | Profil Spring actif | `dev` |
| `SERVER_PORT` | Port d'écoute HTTP | `8080` |
| `MONGODB_URI` | Chaîne de connexion MongoDB | `mongodb://localhost:27017/eni_mail_dev` |
| `JWT_SECRET` | Clé HMAC — **≥ 32 octets obligatoire** | à changer |
| `JWT_ACCESS_TTL_MIN` | Durée de vie du jeton d'accès | `15` |
| `JWT_REFRESH_TTL_DAYS` | Durée de vie du refresh token | `7` |
| `CORS_ALLOWED_ORIGINS` | Origines autorisées (séparées par virgule) | `http://localhost:5173` |
| `ATTACHMENTS_PATH` | Dossier de stockage des pièces jointes | `./data/uploads` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin créé au premier démarrage | `admin@eni.mg` / `Admin@2026!` |

> Le fichier `.env` est référencé dans [`eni-mail-back/.gitignore`](eni-mail-back/.gitignore) — aucun secret ne doit être commit.

---

## Modèle de données MongoDB

Collections créées (avec index déclarés via Spring Data) :

- `users` — index unique sur `email`, index sur `role`, `(filiere, promotion)`.
- `messages` — index composés :
  - `(recipients.userId, recipients.folder, sentAt desc)` — boîte de réception.
  - `(senderId, senderFolder, sentAt desc)` — messages envoyés.
  - `(threadId, createdAt asc)` — conversation.
  - Index texte sur `subject` (poids 2) + `body` — recherche plein texte.
- `groups` — index unique sur `name`.
- `attachments` — index sur `messageId` et `ownerId`.
- `refresh_tokens` — index unique sur `tokenHash`.

Détails de modélisation dans [`docs/uml/02-class-diagram.md`](docs/uml/02-class-diagram.md).

---

## Sécurité

- **Mots de passe** hachés avec **BCrypt** (facteur 12).
- **JWT HS256**, signé avec un secret ≥ 32 octets, jamais stocké côté client. L'access token vit **en mémoire** du front, le refresh dans un **cookie HttpOnly + Secure + SameSite=Lax** avec rotation.
- **Rate limiting** sur `/api/auth/login` (5 tentatives, verrouillage 15 min).
- **Autorisations vérifiées côté serveur** sur chaque endpoint (`@PreAuthorize` + vérifications métier pour `/messages/{id}` et `/attachments/{id}`).
- **Pièces jointes** : taille ≤ 5 Mo, liste blanche de MIME, nom stocké en UUID, protection contre les path traversal.
- **CORS** restreint aux origines configurées, credentials activés pour le cookie.
- **Aucun secret** dans Git (`.env` ignoré).

Pour la production :
- Forcer `secure: true` sur le cookie refresh (voir [`AuthController`](eni-mail-back/src/main/java/mg/eni/email/controller/AuthController.java)) et déployer derrière HTTPS (Nginx/Caddy).
- Utiliser des secrets issus d'un gestionnaire (Vault, etc.), jamais de littéraux.
- Configurer MongoDB avec authentification et TLS.

---

## Endpoints principaux

| Méthode | URL | Rôle |
|---------|-----|------|
| `POST` | `/api/auth/login` | Connexion (email + mot de passe) |
| `POST` | `/api/auth/refresh` | Renouvellement de l'access token |
| `POST` | `/api/auth/logout` | Révocation du refresh |
| `GET` | `/api/users/me` | Profil courant |
| `PATCH` | `/api/users/me` | Mise à jour du profil |
| `POST` | `/api/users/me/password` | Changement de mot de passe |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/users` | Gestion des utilisateurs (admin) |
| `GET` | `/api/messages?folder=INBOX` | Lister un dossier (paginé) |
| `GET` | `/api/messages/{id}` | Détail d'un message |
| `POST` | `/api/messages` | Envoyer / enregistrer un brouillon |
| `PUT` | `/api/messages/drafts/{id}` | Mettre à jour un brouillon |
| `POST` | `/api/messages/{id}/reply` | Répondre |
| `POST` | `/api/messages/{id}/forward` | Transférer |
| `PATCH` | `/api/messages/{id}/read?read=true` | Marquer lu/non lu |
| `DELETE` | `/api/messages/{id}` | Déplacer à la corbeille |
| `POST` | `/api/messages/{id}/restore` | Restaurer |
| `DELETE` | `/api/messages/{id}/permanent` | Suppression définitive |
| `GET` | `/api/messages/folders/counts` | Compteurs par dossier |
| `GET` | `/api/search?q=...` | Recherche plein texte |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/groups` | Groupes |
| `POST` | `/api/attachments` | Upload d'une pièce jointe (multipart) |
| `GET` | `/api/attachments/{id}` | Téléchargement |
| `DELETE` | `/api/attachments/{id}` | Suppression (brouillon uniquement) |
| `GET` | `/api/admin/stats` | Statistiques (admin) |

Format d'erreur uniforme :

```json
{
  "timestamp": "2026-11-06T13:45:00Z",
  "status": 403,
  "error": "Forbidden",
  "code": "MESSAGE_ACCESS_DENIED",
  "message": "Vous n'avez pas acces a ce message",
  "path": "/api/messages/..."
}
```

---

## Tests

### Backend

```bash
cd eni-mail-back
./mvnw test
```

Tests unitaires actifs :
- [`JwtServiceTest`](eni-mail-back/src/test/java/mg/eni/email/security/JwtServiceTest.java) — génération, validation et typage des tokens, rejet des signatures altérées.
- [`LoginAttemptServiceTest`](eni-mail-back/src/test/java/mg/eni/email/security/LoginAttemptServiceTest.java) — verrouillage anti-brute-force.

Le test d'intégration `EmailApplicationTests` est désactivé par défaut (nécessite MongoDB). Pour l'activer :

```bash
docker compose up -d
cd eni-mail-back
./mvnw test -Dtest=EmailApplicationTests -DexcludedGroups=
# Puis retirer @Disabled dans le fichier et relancer
```

### Frontend

```bash
cd eni-mail-frontend
npm run build    # vérifie TypeScript + build Vite
npm run lint     # ESLint
```

---

## Documentation complémentaire

- [`PROJECT_ANALYSIS.md`](PROJECT_ANALYSIS.md) — état initial, décisions techniques, plan de développement.
- [`docs/uml/`](docs/uml/) — 5 diagrammes Mermaid.
- [`docs/user-guide/`](docs/user-guide/) — guide utilisateur.

---

## Build de production

### Backend

```bash
cd eni-mail-back
./mvnw -DskipTests clean package
java -jar target/email-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
cd eni-mail-frontend
npm run build
```

Les fichiers statiques se trouvent dans `eni-mail-frontend/dist/`. Déployer derrière Nginx / Caddy (configuration SPA : rediriger les 404 vers `index.html`).

---

## Licence & crédits

Projet académique développé pour l'ENI. Aucune redistribution commerciale.
