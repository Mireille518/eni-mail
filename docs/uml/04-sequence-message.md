# Séquences — Messagerie

## 1. Envoi d'un message

```mermaid
sequenceDiagram
    autonumber
    actor U as Expéditeur
    participant FE as Frontend
    participant MC as MessageController
    participant MS as MessageService
    participant UR as UserRepository
    participant GR as GroupRepository
    participant AR as AttachmentRepository
    participant MR as MessageRepository

    U->>FE: Composer + Envoyer
    FE->>MC: POST /api/messages {subject, body, toUserIds, toGroupIds, attachmentIds}
    MC->>MS: send(request, currentUser)
    MS->>UR: findAllById(toUserIds)  (vérif existence + actif)
    MS->>GR: findAllById(toGroupIds)
    MS->>MS: expand groups → union des memberIds, dédoublonnage
    MS->>AR: findAllById(attachmentIds) (vérif owner = currentUser)
    MS->>MS: construit List<MessageRecipient> (folder=INBOX, read=false, deleted=false)
    MS->>MR: save(Message{senderFolder=SENT, isDraft=false, sentAt=now})
    MR-->>MS: Message persisté
    MS-->>MC: MessageDto
    MC-->>FE: 201 Created + MessageDto
    FE->>FE: Toast succès + retour Inbox/Sent
```

## 2. Lecture d'un message (destinataire)

```mermaid
sequenceDiagram
    autonumber
    actor U as Destinataire
    participant FE as Frontend
    participant MC as MessageController
    participant MS as MessageService
    participant MR as MessageRepository

    U->>FE: Clic sur un message
    FE->>MC: GET /api/messages/{id}
    MC->>MS: findById(id, currentUser)
    MS->>MR: findById(id)
    MR-->>MS: Message
    MS->>MS: assertAccess(currentUser)
    note right of MS: sender == currentUser\nOU currentUser ∈ recipients.userId
    alt Accès refusé
        MS-->>MC: throw ForbiddenException
        MC-->>FE: 403
    else Accès autorisé
        MS->>MR: markAsRead(id, currentUser.id)  (atomic $set)
        MR-->>MS: updated
        MS-->>MC: MessageDto
        MC-->>FE: 200 OK
    end
```

## 3. Réponse à un message

```mermaid
sequenceDiagram
    autonumber
    actor U
    participant FE
    participant MC as MessageController
    participant MS as MessageService
    participant MR as MessageRepository

    U->>FE: Bouton "Répondre"
    FE->>MC: GET /api/messages/{id}
    FE->>FE: Préremplit sujet (Re:), destinataire (sender), parentId
    U->>FE: Envoyer
    FE->>MC: POST /api/messages/{id}/reply
    MC->>MS: reply(id, body, currentUser)
    MS->>MR: findById(id)
    MS->>MS: assertAccess, calcule threadId := parent.threadId ?? parent.id
    MS->>MR: save(nouveau Message avec parentMessageId=id, threadId=...)
    MC-->>FE: 201 + MessageDto
```

## 4. Suppression et restauration (par destinataire uniquement)

```mermaid
sequenceDiagram
    autonumber
    actor U
    participant FE
    participant MC
    participant MS
    participant MR

    U->>FE: Bouton "Supprimer"
    FE->>MC: DELETE /api/messages/{id}
    MC->>MS: delete(id, currentUser)
    MS->>MR: findById(id)
    MS->>MS: déterminer si currentUser = sender ou destinataire
    alt currentUser est destinataire
        MS->>MR: update recipients.$[r].folder = TRASH, deleted=true, deletedAt=now
        note right of MS: Les autres destinataires\nconservent leur état intact
    else currentUser est sender
        MS->>MR: update senderFolder = TRASH, senderDeleted=true
    end
    MC-->>FE: 204 No Content

    Note over U,FE: Plus tard...

    U->>FE: Restaurer depuis Corbeille
    FE->>MC: POST /api/messages/{id}/restore
    MC->>MS: restore(id, currentUser)
    MS->>MR: update ... folder=INBOX (ou SENT), deleted=false
    MC-->>FE: 204
```

## 5. Envoi à un groupe

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Enseignant
    participant FE
    participant MC
    participant MS
    participant GR as GroupRepository

    Teacher->>FE: Compose, sélectionne groupe "M1 GLBD"
    FE->>MC: POST /api/messages {toGroupIds:[g1], ...}
    MC->>MS: send(...)
    MS->>MS: checkPermission(currentUser, group)
    alt Enseignant non autorisé pour ce groupe
        MS-->>MC: throw ForbiddenException
        MC-->>FE: 403
    else Autorisé
        MS->>GR: findById(g1)
        MS->>MS: union(memberIds via tous les groupes) + explicit TO
        MS->>MS: supprime doublons, retire expéditeur de la liste
        MS->>MS: crée recipients[] une fois par userId
        MS-->>MC: MessageDto
        MC-->>FE: 201
    end
```
