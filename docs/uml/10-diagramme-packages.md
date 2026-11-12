# 10 — Diagramme de packages

## 1. Introduction

Ce document décrit l'organisation logique du code source — **packages Java** côté backend et **dossiers/modules** côté frontend. Il sert de carte au développeur qui reprend le projet.

---

## 2. Backend — packages Java

**Racine** : `mg.eni.email` dans [eni-mail-back/src/main/java/](../../eni-mail-back/src/main/java/mg/eni/email/).

```mermaid
flowchart TB
    subgraph Root["mg.eni.email"]
        App["EmailApplication (main)"]
    end

    subgraph Config["mg.eni.email.config"]
        SC["SecurityConfig"]
        MC["MongoConfig"]
        DI["DataInitializer"]
        JP["JwtProperties"]
        CP["CorsProperties"]
        AP["AttachmentProperties"]
        SP["SecurityProperties"]
        ASP["AdminSeedProperties"]
    end

    subgraph Security["mg.eni.email.security"]
        JS["JwtService"]
        JAF["JwtAuthenticationFilter"]
        CUDS["CustomUserDetailsService"]
        CU["CurrentUser"]
        SU["SecurityUtils"]
        LAS["LoginAttemptService"]
    end

    subgraph Controller["mg.eni.email.controller"]
        AC["AuthController"]
        UC["UserController"]
        MC2["MessageController"]
        GC["GroupController"]
        AtC["AttachmentController"]
        SeC["SearchController"]
        AdC["AdminController"]
    end

    subgraph Service["mg.eni.email.service"]
        AS["AuthService"]
        US["UserService"]
        MS["MessageService"]
        GS["GroupService"]
        AtS["AttachmentService"]
        ASS["AdminStatsService"]
    end

    subgraph Repository["mg.eni.email.repository"]
        UR["UserRepository"]
        MR["MessageRepository<br/>+ MessageRepositoryCustom<br/>+ MessageRepositoryImpl"]
        GR["GroupRepository"]
        AR["AttachmentRepository"]
        RTR["RefreshTokenRepository"]
    end

    subgraph Document["mg.eni.email.document"]
        DU["User"]
        DM["Message"]
        DMR["MessageRecipient"]
        DG["Group"]
        DA["Attachment"]
        DRT["RefreshToken"]
    end

    subgraph Dto["mg.eni.email.dto"]
        Req["request/<br/>LoginRequest<br/>CreateUserRequest<br/>UpdateUserRequest<br/>UpdateProfileRequest<br/>ChangePasswordRequest<br/>ComposeMessageRequest<br/>ReplyRequest<br/>ForwardRequest<br/>CreateGroupRequest<br/>UpdateGroupRequest"]
        Resp["response/<br/>LoginResponse<br/>UserDto<br/>MessageDto<br/>MessageSummaryDto<br/>RecipientDto<br/>AttachmentDto<br/>GroupDto<br/>FolderCountsDto<br/>AdminStatsDto<br/>PageResponse"]
    end

    subgraph Enums["mg.eni.email.enums"]
        ERole["Role"]
        EAS["AccountStatus"]
        EMF["MessageFolder"]
        ERT["RecipientType"]
    end

    subgraph Exception["mg.eni.email.exception"]
        GEH["GlobalExceptionHandler"]
        BE["BusinessException"]
        RNF["ResourceNotFoundException"]
        FE["ForbiddenException"]
        UE["UnauthorizedException"]
        CE["ConflictException"]
        TMR["TooManyRequestsException"]
        AER["ApiErrorResponse"]
    end

    App --> Config
    Config --> Security
    Config --> Repository
    Config --> Document
    Controller --> Service
    Controller --> Dto
    Controller --> Security
    Service --> Repository
    Service --> Document
    Service --> Exception
    Service --> Dto
    Repository --> Document
    Security --> Document
    Security --> Repository
    Security --> Config
    GEH --> Exception
    Document --> Enums
```

### Règles de dépendance

| Du package | Vers | Autorisé |
|------------|------|:--------:|
| `controller` | `service`, `dto`, `security`, `exception` | ✅ |
| `controller` | `repository` | ❌ (interdit — passe par `service`) |
| `service` | `repository`, `document`, `dto`, `exception`, `enums` | ✅ |
| `repository` | `document`, `enums` | ✅ |
| `repository` | `service` | ❌ |
| `document` | `enums` | ✅ |
| `document` | `service`, `controller` | ❌ |
| `security` | `document`, `repository`, `config`, `exception` | ✅ |
| `dto` | `enums`, `document` (lecture seule pour construction) | ✅ |
| `exception` | — (aucun) | ✅ |

### Responsabilités par package

| Package | Responsabilité | Taille approx. |
|---------|----------------|----------------|
| `config` | Beans Spring, propriétés, seed. | 8 classes |
| `security` | Tout ce qui touche à l'auth et au contrôle d'accès. | 6 classes |
| `controller` | Contrat HTTP, mapping URL. **Pas de logique métier.** | 7 classes |
| `service` | Règles métier, orchestration. | 6 classes |
| `repository` | Accès MongoDB (Spring Data + MongoTemplate). | 5+ classes |
| `document` | Entités persistées. | 6 classes |
| `dto` | DTO requête/réponse (sérialisation). | ~22 records |
| `enums` | Types énumérés. | 4 enums |
| `exception` | Exceptions métier + handler global. | 8 classes |

---

## 3. Frontend — modules React

**Racine** : [eni-mail-frontend/src/](../../eni-mail-frontend/src/).

```mermaid
flowchart TB
    subgraph SrcRoot["src/"]
        Main["main.tsx"]
        App["App.tsx"]
        IdxCss["index.css (tokens + utilities)"]
    end

    subgraph Routes["src/routes/"]
        AR["AppRoutes.tsx"]
        PR["ProtectedRoute.tsx"]
        AR2["AdminRoute.tsx"]
    end

    subgraph Layouts["src/layouts/"]
        AuthL["AuthLayout.tsx"]
        AppL["AppLayout.tsx (sidebar + header)"]
    end

    subgraph Features["src/features/"]
        FAuth["auth/<br/>LoginPage"]
        FMail["mail/<br/>MailListPage<br/>MessageViewPage<br/>ComposePage<br/>SearchPage<br/>RecipientPicker"]
        FUsers["users/<br/>ProfilePage"]
        FGroups["groups/<br/>GroupsPage"]
        FAdmin["admin/<br/>AdminDashboard<br/>AdminUsersPage"]
    end

    subgraph Components["src/components/ui/"]
        Logo["Logo"]
        Avatar["Avatar"]
        Spinner["Spinner"]
        Empty["EmptyState"]
        Dlg["ConfirmDialog"]
    end

    subgraph Pages["src/pages/"]
        NF["NotFoundPage"]
    end

    subgraph Contexts["src/contexts/"]
        AuthCtx["AuthContext (user, login, logout, hasRole)"]
    end

    subgraph Services["src/services/"]
        APIc["apiClient.ts (axios + intercepteur)"]
        AA["authApi.ts"]
        MA["messagesApi.ts"]
        UA["usersApi.ts"]
        GA["groupsApi.ts"]
        AtA["attachmentsApi.ts"]
        AdA["adminApi.ts"]
    end

    subgraph Types["src/types/"]
        TA["api.ts (types TS miroir du backend)"]
    end

    subgraph Lib["src/lib/"]
        CN["cn.ts (clsx + tailwind-merge)"]
        FMT["format.ts (date-fns, taille, initiales)"]
    end

    Main --> App
    App --> AR
    AR --> PR --> AppL
    AR --> AR2 --> FAdmin
    AR --> AuthL --> FAuth
    AR --> NF
    AppL --> FMail & FUsers & FGroups
    FAuth & FMail & FUsers & FGroups & FAdmin --> Components
    FAuth & FMail & FUsers & FGroups & FAdmin --> AuthCtx
    FAuth & FMail & FUsers & FGroups & FAdmin --> Services
    Services --> APIc
    AuthCtx --> AA
    Features --> Types
    Features --> Lib
    AppL --> AuthCtx & MA
```

### Règles de dépendance frontend

| De | Vers | Autorisé |
|----|------|:--------:|
| `features/*` | `components/ui`, `services`, `contexts`, `lib`, `types` | ✅ |
| `features/*` | autres `features/*` (import direct) | ⚠️ à éviter (préférer réutilisation via composants partagés) |
| `services/*` | `types/api` | ✅ |
| `services/*` | `features/*` | ❌ (couche basse) |
| `components/ui` | `lib`, aucune `services` | ✅ |
| `contexts/AuthContext` | `services/authApi`, `services/apiClient` | ✅ |
| `routes/*` | `features/*`, `layouts/*` | ✅ |

### Responsabilités

| Module | Responsabilité |
|--------|----------------|
| `main.tsx` | Bootstrap React. |
| `App.tsx` | Providers (Query, Router, Auth, Toaster). |
| `routes/` | Mapping URL ↔ pages, protection de routes. |
| `layouts/` | Chrome visuel (sidebar, topbar, splash d'auth). |
| `features/` | Pages métier regroupées par domaine. |
| `components/ui/` | Primitives UI réutilisables. |
| `pages/` | Pages hors feature (ex : 404). |
| `contexts/` | État global non serveur (ici : auth). |
| `services/` | Appels HTTP typés. |
| `types/` | Types TypeScript partagés. |
| `lib/` | Helpers purs. |
| `index.css` | Tokens de design + utilities Tailwind v4. |

---

## 4. Vue en pile — mapping API

```mermaid
flowchart LR
    subgraph Front["Frontend"]
        AuthApi -- "POST /auth/login" --> AuthC
        MsgApi -- "GET /messages?folder=" --> MsgC
        MsgApi -- "POST /messages" --> MsgC
        UsrApi -- "GET/POST/PATCH/DELETE /users" --> UsrC
        GrpApi -- "CRUD /groups" --> GrpC
        AttApi -- "POST/GET /attachments" --> AttC
        AdmApi -- "GET /admin/stats" --> AdmC
        MsgApi -- "GET /search" --> SeC
    end
    subgraph Back["Backend"]
        AuthC[AuthController] --> AuthS[AuthService]
        MsgC[MessageController] --> MsgS[MessageService]
        UsrC[UserController] --> UsrS[UserService]
        GrpC[GroupController] --> GrpS[GroupService]
        AttC[AttachmentController] --> AttS[AttachmentService]
        AdmC[AdminController] --> AdmS[AdminStatsService]
        SeC[SearchController] --> MsgS
    end
```

---

## 5. Suite

→ [11-modele-donnees-mongodb.md](11-modele-donnees-mongodb.md) — structure NoSQL détaillée.
