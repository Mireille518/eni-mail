# Documentation des endpoints — ENI Mail API

Toutes les URL sont préfixées par `/api`. Les requêtes authentifiées exigent
l'en-tête `Authorization: Bearer <access_token>` (le cookie `eni_refresh` est
géré automatiquement par le navigateur).

## 1. Authentification

### POST `/auth/login`
Body :
```json
{ "email": "u@eni.mg", "password": "..." }
```
200 OK :
```json
{
  "accessToken": "eyJ...",
  "expiresInSeconds": 900,
  "user": { "id": "...", "email": "...", "role": "ROLE_ETUDIANT", ... }
}
```
Pose un cookie `eni_refresh` (HttpOnly, SameSite=Lax, path=/api/auth).

### POST `/auth/refresh`
Aucun body — lit le cookie `eni_refresh`. Renvoie le même format que `/login`.
Le refresh token est **tourné** à chaque appel.

### POST `/auth/logout`
Révoque le refresh courant, vide le cookie. Renvoie `204 No Content`.

### GET `/auth/me`
Renvoie l'utilisateur courant (identique à `/users/me`).

---

## 2. Utilisateurs

### GET `/users/me`
Profil courant.

### PATCH `/users/me`
```json
{ "firstName": "...", "lastName": "...", "filiere": "...", "promotion": "...", "avatarUrl": "..." }
```

### POST `/users/me/password`
```json
{ "currentPassword": "...", "newPassword": "..." }
```

### GET `/users?q=&role=&page=0&size=20`
Liste paginée. Accessible à tous les utilisateurs authentifiés (pour choisir
un destinataire par exemple).

### GET `/users/{id}`
Détail d'un utilisateur.

### POST `/users` *(admin)*
```json
{
  "email": "...",
  "password": "...",
  "firstName": "...",
  "lastName": "...",
  "role": "ROLE_ETUDIANT",
  "filiere": "...",
  "promotion": "..."
}
```

### PATCH `/users/{id}` *(admin)*
Mise à jour partielle : `firstName`, `lastName`, `filiere`, `promotion`,
`avatarUrl`, `role`, `status` (`ACTIVE|DISABLED`).

### DELETE `/users/{id}` *(admin)*
Désactivation logique (status = DISABLED). Il est interdit à un admin de se
désactiver lui-même.

---

## 3. Messages

### GET `/messages?folder=INBOX&page=0&size=20&sort=sentAt,desc`
Valeurs de `folder` : `INBOX | SENT | DRAFT | TRASH`.

### GET `/messages/folders/counts`
```json
{ "inboxTotal": 42, "inboxUnread": 3, "sentTotal": 10, "drafts": 1, "trash": 2 }
```

### GET `/messages/{id}`
Détail. Accessible uniquement si vous êtes **expéditeur** ou **destinataire**
(sinon 403). La lecture marque automatiquement comme lu si vous êtes
destinataire.

### POST `/messages`
```json
{
  "subject": "...",
  "body": "...",
  "toUserIds": ["..."],
  "ccUserIds": [],
  "bccUserIds": [],
  "toGroupIds": [],
  "attachmentIds": [],
  "parentMessageId": null,
  "asDraft": false
}
```
Retourne le message créé (201).

### PUT `/messages/drafts/{id}`
Mise à jour d'un brouillon. Mettez `asDraft: false` pour l'envoyer.

### POST `/messages/{id}/reply`
```json
{ "body": "...", "replyAll": false, "attachmentIds": [] }
```

### POST `/messages/{id}/forward`
```json
{ "body": "...", "toUserIds": ["..."], "toGroupIds": ["..."] }
```

### PATCH `/messages/{id}/read?read=true|false`
Marquer lu/non lu (pour un destinataire).

### DELETE `/messages/{id}`
Déplace à la corbeille (pour vous : expéditeur **ou** destinataire).

### POST `/messages/{id}/restore`
Restaure depuis la corbeille vers Inbox (destinataire) ou Sent (expéditeur).

### DELETE `/messages/{id}/permanent`
Suppression définitive. Le document n'est réellement supprimé que si plus
aucun utilisateur ne peut encore le voir.

---

## 4. Recherche

### GET `/search?q=...&page=0&size=20`
Recherche plein texte sur `subject` + `body`, restreinte aux messages où
vous êtes expéditeur ou destinataire.

---

## 5. Groupes

### GET `/groups?page=0&size=20`
- Étudiant : groupes dont il est membre.
- Enseignant / Admin : tous les groupes.

### GET `/groups/{id}`

### POST `/groups` *(enseignant / admin)*
```json
{ "name": "M1 GLBD", "description": "...", "memberIds": ["..."] }
```

### PATCH `/groups/{id}` *(créateur enseignant ou admin)*
```json
{ "name": "...", "description": "..." }
```

### DELETE `/groups/{id}` *(créateur enseignant ou admin)*

### POST `/groups/{id}/members`
```json
["userId1", "userId2"]
```

### DELETE `/groups/{id}/members/{memberId}`

---

## 6. Pièces jointes

### POST `/attachments` (multipart)
Champ `file`. Renvoie :
```json
{ "id": "...", "filename": "...", "contentType": "...", "size": 12345, "downloadUrl": "/api/attachments/..." }
```
Contraintes :
- ≤ 5 Mo.
- Type MIME dans la liste blanche (voir `application.yml`).
- Nom nettoyé (pas de `..`, `/`, `\`).

### GET `/attachments/{id}`
Téléchargement avec `Content-Disposition: attachment; filename*=...`.
Accessible au propriétaire, à l'expéditeur du message associé, à ses
destinataires, ou à un administrateur.

### DELETE `/attachments/{id}`
Supprime la pièce jointe **si elle n'est pas attachée à un message envoyé**.

---

## 7. Administration

### GET `/admin/stats` *(admin)*
```json
{
  "totalUsers": 42,
  "totalStudents": 30,
  "totalTeachers": 10,
  "totalAdmins": 2,
  "totalMessages": 123,
  "totalGroups": 5,
  "activeUsers": 40
}
```

---

## Codes d'erreur applicatifs

| Code | HTTP | Signification |
|------|------|---------------|
| `VALIDATION_FAILED` | 400 | Un ou plusieurs champs invalides (voir `violations[]`) |
| `BAD_CURRENT_PASSWORD` | 400 | Mot de passe actuel incorrect |
| `UNAUTHORIZED` | 401 | Non authentifié |
| `BAD_CREDENTIALS` | 401 | Email/mot de passe invalide |
| `ACCESS_DENIED` | 403 | Rôle insuffisant |
| `MESSAGE_ACCESS_DENIED` | 403 | Vous n'avez pas accès à ce message |
| `ATTACHMENT_FORBIDDEN` | 403 | Vous ne pouvez pas accéder à cette pièce jointe |
| `CANNOT_ASSIGN_ADMIN` | 403 | Seul un admin peut créer un admin |
| `CANNOT_DISABLE_SELF` | 403 | Un admin ne peut pas se désactiver |
| `GROUP_WRITE_FORBIDDEN` | 403 | Création de groupe réservée aux enseignants/admin |
| `GROUP_MANAGE_FORBIDDEN` | 403 | Modification/suppression de groupe réservée au créateur ou admin |
| `GROUP_SEND_FORBIDDEN` | 403 | Envoi au groupe non autorisé pour cet étudiant |
| `NOT_RECIPIENT` | 403 | Opération réservée aux destinataires du message |
| `RESOURCE_NOT_FOUND` | 404 | Ressource introuvable |
| `MESSAGE_NOT_FOUND` | 404 | |
| `DRAFT_NOT_FOUND` | 404 | |
| `GROUP_NOT_FOUND` | 404 | |
| `RECIPIENT_NOT_FOUND` | 404 | |
| `ATTACHMENT_NOT_FOUND` | 404 | |
| `USER_NOT_FOUND` | 404 | |
| `NOT_A_DRAFT` | 409 | Ce message n'est plus un brouillon |
| `EMAIL_ALREADY_USED` | 409 | Email déjà pris |
| `GROUP_NAME_TAKEN` | 409 | Nom de groupe déjà utilisé |
| `RECIPIENT_DISABLED` | 409 | Un destinataire est désactivé |
| `ATTACHMENT_LOCKED` | 409 | Impossible de supprimer une pièce jointe envoyée |
| `FILE_TOO_LARGE` | 413 | Fichier > 5 Mo |
| `MIME_NOT_ALLOWED` | 415 | Type MIME non autorisé |
| `TOO_MANY_REQUESTS` | 429 | Verrouillage temporaire anti-brute-force |
