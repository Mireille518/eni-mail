import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { AppLayout } from '../layouts/AppLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { MailListPage } from '../features/mail/MailListPage'
import { MessageViewPage } from '../features/mail/MessageViewPage'
import { ComposePage } from '../features/mail/ComposePage'
import { SearchPage } from '../features/mail/SearchPage'
import { GroupsPage } from '../features/groups/GroupsPage'
import { ProfilePage } from '../features/users/ProfilePage'
import { AdminDashboard } from '../features/admin/AdminDashboard'
import { AdminUsersPage } from '../features/admin/AdminUsersPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<MailListPage />} />
          <Route path="/sent" element={<MailListPage />} />
          <Route path="/drafts" element={<MailListPage />} />
          <Route path="/trash" element={<MailListPage />} />
          <Route path="/messages/:id" element={<MessageViewPage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
