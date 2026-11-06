# Diagramme de classes (modèle métier) — ENI Mail

```mermaid
classDiagram
    class User {
        +String id
        +String email
        -String passwordHash
        +String firstName
        +String lastName
        +Role role
        +String filiere
        +String promotion
        +String avatarUrl
        +AccountStatus status
        +Instant createdAt
        +Instant updatedAt
    }

    class Role {
        <<enumeration>>
        ROLE_ETUDIANT
        ROLE_ENSEIGNANT
        ROLE_ADMIN
    }

    class AccountStatus {
        <<enumeration>>
        ACTIVE
        DISABLED
    }

    class Message {
        +String id
        +String senderId
        +String subject
        +String body
        +List~MessageRecipient~ recipients
        +MessageFolder senderFolder
        +boolean senderDeleted
        +Instant senderDeletedAt
        +boolean isDraft
        +String parentMessageId
        +String threadId
        +List~String~ attachmentIds
        +List~String~ groupIds
        +Instant createdAt
        +Instant sentAt
    }

    class MessageRecipient {
        +String userId
        +RecipientType type
        +boolean read
        +Instant readAt
        +MessageFolder folder
        +boolean deleted
        +Instant deletedAt
    }

    class MessageFolder {
        <<enumeration>>
        INBOX
        SENT
        DRAFT
        TRASH
    }

    class RecipientType {
        <<enumeration>>
        TO
        CC
        BCC
    }

    class Group {
        +String id
        +String name
        +String description
        +List~String~ memberIds
        +String createdBy
        +Instant createdAt
        +Instant updatedAt
    }

    class Attachment {
        +String id
        +String messageId
        +String ownerId
        +String filename
        +String storedName
        +String contentType
        +long size
        +Instant createdAt
    }

    class RefreshToken {
        +String id
        +String userId
        +String tokenHash
        +Instant expiresAt
        +boolean revoked
        +Instant createdAt
    }

    User "1" --> "*" Message : envoie
    Message "1" o-- "*" MessageRecipient : destinataires
    Message "0..1" --> "*" Message : réponses (parentMessageId)
    Message "*" --> "*" Group : via groupIds
    Message "1" --> "*" Attachment : attachmentIds
    User "*" -- "*" Group : memberIds
    User "1" --> "*" RefreshToken

    User --> Role
    User --> AccountStatus
    Message --> MessageFolder
    MessageRecipient --> MessageFolder
    MessageRecipient --> RecipientType
```

## Invariants métier principaux

1. `passwordHash` n'est jamais exposé dans un DTO de réponse.
2. Un `User` ne peut pas s'attribuer lui-même `ROLE_ADMIN`.
3. Un `Message` avec `isDraft = true` n'a pas de `sentAt` et n'apparaît dans aucun `recipients[].folder` tant qu'il n'est pas envoyé.
4. L'état lu/supprimé d'un destinataire est indépendant des autres destinataires.
5. L'expéditeur dispose de son propre `senderFolder` et `senderDeleted` indépendants.
6. Les `attachmentIds` et `groupIds` référencent uniquement des entités existantes (vérifié au service).
