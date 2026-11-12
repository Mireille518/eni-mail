# 07 — Diagrammes d'états-transitions

## 1. Introduction

Ce document présente les **machines à états** des principales entités de ENI Mail. Il souligne le fait que certaines entités ont un état **composite** : le statut d'un `Message` n'est pas unique — il existe une **projection** par acteur (expéditeur et chaque destinataire).

Notation : Mermaid `stateDiagram-v2`.

---

## 2. ET-01 — Cycle de vie d'un message (vue globale)

### 2.1. Problématique

Un message n'a **pas** d'état global unique. Chaque partie prenante a sa propre vue :

- L'expéditeur a `senderFolder ∈ {SENT, DRAFT, TRASH}` et `senderDeleted ∈ {false, true}`.
- Chaque destinataire a `recipients[i].folder ∈ {INBOX, TRASH, DRAFT}`, `read`, `deleted`.

On distingue donc trois machines séparées : **document**, **projection expéditeur**, **projection destinataire**.

### 2.2. ET-01-a — Cycle du document `Message`

```mermaid
stateDiagram-v2
    [*] --> Brouillon : save(draft=true)
    Brouillon --> Brouillon : updateDraft(asDraft=true)
    Brouillon --> Envoye : updateDraft(asDraft=false)<br/>sentAt=now
    [*] --> Envoye : send() direct (asDraft=false)
    Envoye --> Supprime_definitivement : deletePermanent<br/>si plus personne ne le voit
    Brouillon --> Supprime_definitivement : deletePermanent (owner uniquement)
    Supprime_definitivement --> [*]
```

**Transitions interdites** : on ne revient pas de `Envoye` vers `Brouillon` (l'envoi est définitif ; pour corriger il faut créer un nouveau message).

### 2.3. ET-01-b — Cycle de la projection « expéditeur »

Décrit par `(senderFolder, senderDeleted)`.

```mermaid
stateDiagram-v2
    [*] --> Dans_Brouillons : senderFolder=DRAFT, senderDeleted=false
    Dans_Brouillons --> Dans_Envoyes : updateDraft(asDraft=false)<br/>senderFolder=SENT
    [*] --> Dans_Envoyes : send() direct
    Dans_Brouillons --> Dans_Corbeille_sender : moveToTrash<br/>senderFolder=TRASH, senderDeleted=true
    Dans_Envoyes --> Dans_Corbeille_sender : moveToTrash
    Dans_Corbeille_sender --> Dans_Envoyes : restore
    Dans_Corbeille_sender --> [*] : deletePermanent (+ garbage si plus personne)
```

### 2.4. ET-01-c — Cycle de la projection « destinataire » (pour chaque destinataire indépendamment)

```mermaid
stateDiagram-v2
    [*] --> Non_lu : message sent<br/>recipients.$.read=false, folder=INBOX, deleted=false
    Non_lu --> Lu : GET /api/messages/{id} par ce destinataire
    Lu --> Non_lu : PATCH /read?read=false
    Non_lu --> Dans_Corbeille : moveToTrash<br/>folder=TRASH, deleted=true
    Lu --> Dans_Corbeille : moveToTrash
    Dans_Corbeille --> Non_lu : restore + markAsUnread
    Dans_Corbeille --> Lu : restore
    Dans_Corbeille --> [*] : deletePermanent
    Lu --> [*] : deletePermanent direct
    Non_lu --> [*] : deletePermanent direct

    note right of Non_lu
        Chaque destinataire a sa propre
        instance de cette machine.
    end note
```

### 2.5. Illustration concrète

**Scénario :** `prof_rakoto` envoie à `etu_andria` et `etu_ravelo`. Instantané des trois machines :

| Entité | Machine 1 (document) | Machine 2 (sender) | Machine 3 (etu_andria) | Machine 3 (etu_ravelo) |
|--------|----------------------|--------------------|-------------------------|-------------------------|
| t₀ (envoi) | Envoye | Dans_Envoyes | Non_lu | Non_lu |
| t₁ (etu_andria ouvre) | Envoye | Dans_Envoyes | Lu | Non_lu |
| t₂ (etu_andria supprime) | Envoye | Dans_Envoyes | Dans_Corbeille | Non_lu |
| t₃ (etu_andria supprime def.) | Envoye (encore vu par 2 personnes) | Dans_Envoyes | [⊥] | Non_lu |

**Conclusion** : le document n'est effacé qu'une fois toutes les projections à `[*]` (`someoneStillSees = false` dans [MessageService](../../eni-mail-back/src/main/java/mg/eni/email/service/MessageService.java)).

---

## 3. ET-02 — Cycle de vie d'un utilisateur

```mermaid
stateDiagram-v2
    [*] --> Actif : POST /api/users par admin<br/>status=ACTIVE
    Actif --> Desactive : DELETE /api/users/{id} par admin<br/>status=DISABLED
    Desactive --> Actif : PATCH /api/users/{id} par admin<br/>status=ACTIVE

    note left of Desactive
        - Ne peut plus se connecter
        - Reste auteur/destinataire des messages historiques
        - Ne peut plus etre destinataire d'un nouveau message
          (RECIPIENT_DISABLED au moment de l'envoi)
    end note

    Desactive --> [*] : suppression manuelle future<br/>(non implementee en V1)
    Actif --> [*] : idem
```

### Précisions

- **Pas de suppression dure** en V1 : la désactivation conserve l'historique.
- L'admin ne peut pas **se désactiver lui-même** (RM-02 → 403 `CANNOT_DISABLE_SELF`).
- Un utilisateur désactivé qui aurait un access token encore valide sera refusé au prochain filtre : `JwtAuthenticationFilter` vérifie `isEnabled()` via `CurrentUser`.

---

## 4. ET-03 — Cycle de vie d'une session

```mermaid
stateDiagram-v2
    [*] --> Non_authentifiee : chargement initial
    Non_authentifiee --> Authentifiee_avec_refresh : trySilentRefresh() OK<br/>(cookie valide)
    Non_authentifiee --> Authentifiee_avec_refresh : POST /api/auth/login
    Authentifiee_avec_refresh --> Access_expire : ttl access (15 min) ecoule
    Access_expire --> Authentifiee_avec_refresh : intercepteur Axios refresh OK
    Access_expire --> Non_authentifiee : refresh invalide/expire
    Authentifiee_avec_refresh --> Non_authentifiee : POST /api/auth/logout
    Authentifiee_avec_refresh --> Non_authentifiee : fermeture navigateur<br/>(access perdu, refresh conserve en cookie)
```

### Points détaillés

| État | Marqueurs | Côté front | Côté back |
|------|-----------|------------|-----------|
| Non authentifiée | Pas de `accessToken` en mémoire, cookie absent/expiré. | `user = null`, route `/login`. | Pas de SecurityContext. |
| Authentifiée avec refresh | `accessToken` en mémoire + cookie `eni_refresh` valide. | `user` défini, navigation libre. | `CurrentUser` dans `SecurityContext` pendant chaque requête. |
| Access expiré | `accessToken` toujours en mémoire mais le serveur retourne 401. | L'intercepteur Axios déclenche automatiquement `/auth/refresh`. | Backend rejette 401 sur les endpoints protégés. |

### Détection de vol

Si un ancien `refresh` révoqué est présenté, `AuthService.refresh` **révoque tous les refresh de l'utilisateur** — scénario :

```mermaid
stateDiagram-v2
    [*] --> Legitime_authentifie
    Legitime_authentifie --> Attaque_en_cours : vol du cookie + rotation par l'attaquant<br/>(utilisateur legitime a encore l'ancien)
    Attaque_en_cours --> Session_totalement_fermee : utilisateur legitime tente son refresh (revoque)<br/>→ purge tous les refresh
    Session_totalement_fermee --> [*] : les deux parties doivent se reconnecter
```

---

## 5. ET-04 — Cycle de vie d'un `RefreshToken`

```mermaid
stateDiagram-v2
    [*] --> Valide : save(revoked=false, expiresAt=now+7j)
    Valide --> Revoque_par_rotation : POST /auth/refresh<br/>(un nouveau remplace celui-ci)
    Valide --> Revoque_par_logout : POST /auth/logout
    Valide --> Expire : date atteinte
    Revoque_par_rotation --> Marque_vole : si presente a nouveau<br/>→ purge tous les refresh user
    Revoque_par_logout --> Marque_vole : idem
    Marque_vole --> [*]
    Expire --> [*]
    Revoque_par_rotation --> [*]
    Revoque_par_logout --> [*]
```

---

## 6. ET-05 — Cycle de vie d'une pièce jointe

```mermaid
stateDiagram-v2
    [*] --> Flottante : POST /api/attachments<br/>messageId=null, ownerId=user
    Flottante --> Rattachee_a_brouillon : updateDraft/send<br/>messageId=draft.id
    Rattachee_a_brouillon --> Rattachee_a_envoi : updateDraft asDraft=false<br/>draft.sentAt set
    Flottante --> Rattachee_a_envoi : send direct
    Flottante --> Supprimee : DELETE par owner
    Rattachee_a_brouillon --> Supprimee : DELETE par owner (brouillon encore)
    Rattachee_a_envoi --> Rejetee : DELETE tente<br/>→ 409 ATTACHMENT_LOCKED
    Rattachee_a_envoi --> Orpheline : deletePermanent du message<br/>(nettoyage differe, V2)
    Supprimee --> [*]
    Orpheline --> [*]
    Rejetee --> Rattachee_a_envoi
```

**Note V1** : les pièces jointes orphelines (après suppression définitive d'un message) ne sont pas garbage-collectées automatiquement — à ajouter en V2 via un job planifié.

---

## 7. ET-06 — Cycle de vie d'un groupe

```mermaid
stateDiagram-v2
    [*] --> Actif : POST /api/groups
    Actif --> Actif : PATCH ou membership changes
    Actif --> Supprime : DELETE par admin ou createur
    Supprime --> [*]

    note right of Supprime
        Les messages historiques conservent
        groupIds pointant vers ce groupe,
        mais les expansions futures echouent
        avec GROUP_NOT_FOUND.
    end note
```

---

## 8. Récapitulatif des invariants

| Invariant | Garantie |
|-----------|----------|
| Un refresh révoqué ne peut jamais redonner un access. | `AuthService.refresh` vérifie `stored.isRevoked()`. |
| Un message ne peut repasser de `Envoye` à `Brouillon`. | Aucune API ne permet cette transition. |
| La corbeille d'un destinataire n'affecte pas les autres. | Mise à jour atomique `recipients.$.folder`. |
| Un compte désactivé ne peut plus émettre de requêtes authentifiées. | `CurrentUser.isEnabled()` vérifié par `JwtAuthenticationFilter`. |
| Un draft ne peut pas être envoyé sans destinataire. | `MessageService.buildMessage` : `NO_RECIPIENT`. |

---

## 9. Suite

→ [08-diagramme-composants.md](08-diagramme-composants.md) — architecture statique du système.
