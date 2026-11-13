# 08 — Diagramme de composants

## 1. Introduction

Ce document présente les **composants logiciels** d'ENI Mail et leurs interfaces. Il s'agit d'une vue UML 2.5 des *Components*, plus détaillée qu'un simple diagramme d'architecture.

Un composant est une unité de livraison avec des **interfaces requises** (ce dont il a besoin) et des **interfaces fournies** (ce qu'il expose).

---

## 2. Vue générale

### Représentation graphique (PlantUML)

![Diagramme de composants ENI Mail](diagrams/png/component-diagram.png)

**Figure 8.1 — Composants logiciels et interfaces d'ENI Mail.**

> Source éditable : [`sources/component-diagram.puml`](sources/component-diagram.puml) · Version vectorielle : [SVG](diagrams/svg/component-diagram.svg).

### Équivalent Mermaid

```mermaid
flowchart TB
    subgraph Client["Navigateur"]
        FEComp["Frontend ENI Mail (SPA React)"]
    end

    subgraph Serveur["Serveur applicatif"]
        BEComp["Backend Spring Boot (JVM)"]
        FS["Filesystem<br/>./data/uploads/"]
    end

    subgraph Donnees["Base de données"]
        MDB["MongoDB 7"]
    end

    FEComp -- "HTTP(S) JSON<br/>Authorization: Bearer<br/>Cookie eni_refresh" --> BEComp
    BEComp -- "MongoDB wire protocol<br/>localhost:27017" --> MDB
    BEComp -- "I/O local" --> FS
```

---

## 3. Composants du frontend

```mermaid
flowchart LR
    subgraph FE["Frontend React 19 + Vite"]
        direction TB

        subgraph Pages["Pages & Features"]
            Login["LoginPage"]
            Mail["MailListPage<br/>MessageViewPage<br/>ComposePage<br/>SearchPage"]
            Groups["GroupsPage"]
            Profile["ProfilePage"]
            Admin["AdminDashboard<br/>AdminUsersPage"]
            NF["NotFoundPage"]
        end

        subgraph Layouts
            AuthL["AuthLayout"]
            AppL["AppLayout<br/>(sidebar + header)"]
        end

        subgraph Routing
            Rtr["AppRoutes"]
            PR["ProtectedRoute"]
            AR["AdminRoute"]
        end

        subgraph State["Contextes & cache"]
            AuthCtx["AuthContext<br/>(user, login, logout)"]
            RQ["React Query cache"]
        end

        subgraph UI["Composants UI"]
            Logo["Logo"]
            Avatar["Avatar"]
            Dlg["ConfirmDialog"]
            Spin["Spinner"]
            Empty["EmptyState"]
            Picker["RecipientPicker"]
        end

        subgraph Services["Services API (interface requise)"]
            APIc["apiClient (Axios)<br/>intercepteur refresh"]
            AuthApi["authApi"]
            MsgApi["messagesApi"]
            UsrApi["usersApi"]
            GrpApi["groupsApi"]
            AttApi["attachmentsApi"]
            AdmApi["adminApi"]
        end

        subgraph Libs["Librairies"]
            RHF["react-hook-form + Zod"]
            Sonner["sonner (toasts)"]
            DF["date-fns"]
            Lucide["lucide-react"]
        end
    end

    Login & Mail & Groups & Profile & Admin --> AuthCtx
    Login & Mail & Groups & Profile & Admin --> AuthApi & MsgApi & UsrApi & GrpApi & AttApi & AdmApi
    Login & Mail & Compose --> RHF
    Rtr --> PR --> AppL --> Mail & Groups & Profile & Admin
    PR --> AR --> Admin
    AppL --> Logo & Avatar
    Mail & Compose --> Picker
    AuthApi & MsgApi & UsrApi & GrpApi & AttApi & AdmApi --> APIc
    AuthCtx --> AuthApi
```

### Interfaces fournies par le frontend

- **UI web** : SPA servie sur `/` (dev : `http://localhost:5173`, prod : via Nginx).

### Interfaces requises par le frontend

- **API REST ENI Mail** : préfixe `/api` (proxyé par Vite en dev).
- **Google Fonts** : chargement de Inter + Manrope + JetBrains Mono.

---

## 4. Composants du backend

```mermaid
flowchart LR
    subgraph BE["Backend Spring Boot 3.3"]
        direction TB

        subgraph Controllers["Couche presentation"]
            AC["AuthController"]
            UC["UserController"]
            MC["MessageController"]
            GC["GroupController"]
            AtC["AttachmentController"]
            SC["SearchController"]
            AdC["AdminController"]
        end

        subgraph Security["Spring Security"]
            SF["SecurityFilterChain"]
            Jfilter["JwtAuthenticationFilter"]
            CUDS["CustomUserDetailsService"]
            BCrypt["PasswordEncoder (BCrypt)"]
            JS["JwtService"]
            LA["LoginAttemptService"]
            SU["SecurityUtils"]
            Cfg["SecurityConfig<br/>+ CorsConfig"]
            PropsJwt["JwtProperties"]
            PropsCors["CorsProperties"]
        end

        subgraph Services["Couche metier"]
            AuthS["AuthService"]
            UserS["UserService"]
            MsgS["MessageService"]
            GrpS["GroupService"]
            AttS["AttachmentService"]
            AdmS["AdminStatsService"]
        end

        subgraph Repositories["Couche acces donnees"]
            UR["UserRepository"]
            MR["MessageRepository<br/>+ MessageRepositoryCustom"]
            GR["GroupRepository"]
            AR["AttachmentRepository"]
            RTR["RefreshTokenRepository"]
            MT["MongoTemplate<br/>(mises a jour atomiques)"]
        end

        subgraph Docs["Documents / enums / DTO"]
            DocUser["User, RefreshToken"]
            DocMsg["Message + MessageRecipient<br/>+ MessageFolder, RecipientType"]
            DocGrp["Group"]
            DocAtt["Attachment"]
            Role["Role, AccountStatus"]
            Dtos["DTO : *Request, *Dto<br/>+ ApiErrorResponse"]
        end

        subgraph Config["Configuration"]
            Init["DataInitializer"]
            MCfg["MongoConfig"]
            AttP["AttachmentProperties"]
            AdmP["AdminSeedProperties"]
            SecP["SecurityProperties"]
        end

        subgraph Exceptions["Gestion d'erreurs"]
            GEH["GlobalExceptionHandler"]
            Biz["BusinessException<br/>+ Forbidden, Resource, Conflict,<br/>Unauthorized, TooManyRequests"]
        end
    end

    AC --> AuthS
    UC --> UserS
    MC --> MsgS
    GC --> GrpS
    AtC --> AttS
    SC --> MsgS & MR
    AdC --> AdmS

    AuthS --> UserS & JS & LA & RTR & BCrypt
    UserS --> UR & BCrypt
    MsgS --> MR & UR & GR & AR
    GrpS --> GR & UR
    AttS --> AR & MR & AttP
    AdmS --> UR & MT

    SF --> Jfilter --> JS & CUDS
    Cfg --> SF & BCrypt & CUDS
    CUDS --> UR
    AC & UC & MC & GC & AtC & SC & AdC --> SU
    SU --> SecP

    UR --> DocUser
    MR --> DocMsg
    GR --> DocGrp
    AR --> DocAtt
    RTR --> DocUser

    AC & UC & MC & GC & AtC & SC & AdC --> Dtos

    Init --> UR & BCrypt & AdmP

    GEH --> Biz
    AC & UC & MC & GC & AtC & SC & AdC --> GEH
```

### Interfaces fournies

| Interface | Protocole | Implémentation |
|-----------|-----------|----------------|
| `IAuthAPI` | REST JSON | `/api/auth/*` |
| `IUserAPI` | REST JSON | `/api/users/*` |
| `IMessageAPI` | REST JSON | `/api/messages/*` |
| `IFolderCountsAPI` | REST JSON | `/api/messages/folders/counts` |
| `ISearchAPI` | REST JSON | `/api/search` |
| `IGroupAPI` | REST JSON | `/api/groups/*` |
| `IAttachmentAPI` | REST JSON + multipart | `/api/attachments/*` |
| `IAdminAPI` | REST JSON | `/api/admin/*` |

### Interfaces requises

| Interface | Fournisseur | Fichier |
|-----------|-------------|---------|
| `MongoDB` | Serveur MongoDB 7 | `application-dev.yml` → `spring.data.mongodb.uri` |
| `Filesystem` | OS hôte | `AttachmentProperties.storagePath` (dev : `./data/uploads`) |
| `JVM 17+` | OpenJDK 21 | `pom.xml` java.version |

---

## 5. Dépendances principales (vue Maven simplifiée)

```mermaid
flowchart LR
    BE["Backend Spring Boot 3.3.5"]
    BE --> SW["spring-boot-starter-web<br/>(MVC + Tomcat)"]
    BE --> SS["spring-boot-starter-security"]
    BE --> SDM["spring-boot-starter-data-mongodb"]
    BE --> SV["spring-boot-starter-validation"]
    BE --> JJ["jjwt-api / -impl / -jackson 0.12.6"]
    BE --> LB["lombok"]
    BE --> DT["spring-boot-devtools (dev)"]
    BE --> JUnit["spring-boot-starter-test<br/>+ spring-security-test"]
```

---

## 6. Vue déploiement condensée

Les composants cités sont déployés comme suit :

```mermaid
flowchart LR
    subgraph User["Utilisateur"]
        BR["Navigateur"]
    end
    subgraph Front["Serveur web (Nginx en prod)"]
        FE_Build["dist/ (SPA React)"]
    end
    subgraph App["Serveur Java"]
        JAR["email-0.0.1-SNAPSHOT.jar<br/>(Spring Boot embedded Tomcat)"]
        UPL["/var/eni-mail/uploads/"]
    end
    subgraph Data["Serveur de donnees"]
        MDB["MongoDB 7"]
    end

    BR -- "HTTPS /" --> FE_Build
    BR -- "HTTPS /api/*" --> JAR
    JAR --> UPL
    JAR --> MDB
```

Détail complet dans [09-diagramme-deploiement.md](09-diagramme-deploiement.md).

---

## 7. Suite

→ [09-diagramme-deploiement.md](09-diagramme-deploiement.md) — nœuds physiques, ports, environnements.
