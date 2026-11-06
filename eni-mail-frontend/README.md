# ENI Mail — Frontend

Interface React 19 + Vite + Tailwind CSS v4 pour la messagerie interne ENI Mail.

## Démarrage

```bash
npm install
npm run dev    # http://localhost:5173
```

Les requêtes `/api/*` sont proxifiées vers `http://localhost:8080` (configurable dans [`vite.config.ts`](vite.config.ts)).

## Scripts

- `npm run dev` — serveur de développement avec HMR
- `npm run build` — build de production (dist/)
- `npm run preview` — aperçu local du build
- `npm run lint` — ESLint

## Organisation

```
src/
├── main.tsx              Bootstrap
├── App.tsx               Providers (Query, Router, Auth, Toaster)
├── routes/               ProtectedRoute, AdminRoute, AppRoutes
├── layouts/              AuthLayout, AppLayout (sidebar + topbar)
├── features/
│   ├── auth/             LoginPage
│   ├── mail/             MailListPage, MessageViewPage, ComposePage, SearchPage, RecipientPicker
│   ├── users/            ProfilePage
│   ├── groups/           GroupsPage
│   └── admin/            AdminDashboard, AdminUsersPage
├── components/ui/        Avatar, Spinner, EmptyState, ConfirmDialog
├── services/             apiClient (axios), authApi, messagesApi, usersApi, groupsApi, attachmentsApi, adminApi
├── contexts/             AuthContext
├── lib/                  cn (clsx+tailwind-merge), format (dates / taille / initiales)
├── types/                Types TypeScript du contrat API
└── index.css             Tokens Tailwind v4 + utilities (@utility btn/card/input/badge)
```

## Stratégie d'authentification

- **Access token JWT** gardé **en mémoire** (variable du module `apiClient`).
- **Refresh token** dans un cookie **HttpOnly + SameSite=Lax** posé par le backend (jamais lisible par JS).
- Au chargement de l'app, `trySilentRefresh()` tente un `/api/auth/refresh` pour restaurer la session après un rechargement.
- Intercepteur Axios : sur `401`, un refresh est tenté automatiquement, la requête est rejouée.

Voir [`src/services/apiClient.ts`](src/services/apiClient.ts) et [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx).
