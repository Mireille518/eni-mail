export type Role = 'ROLE_ETUDIANT' | 'ROLE_ENSEIGNANT' | 'ROLE_ADMIN'
export type AccountStatus = 'ACTIVE' | 'DISABLED'
export type MessageFolder = 'INBOX' | 'SENT' | 'DRAFT' | 'TRASH'
export type RecipientType = 'TO' | 'CC' | 'BCC'

export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  filiere?: string | null
  promotion?: string | null
  avatarUrl?: string | null
  status: AccountStatus
  createdAt: string
  updatedAt?: string | null
}

export interface LoginResponse {
  accessToken: string
  expiresInSeconds: number
  user: UserDto
}

export interface RecipientDto {
  userId: string
  displayName: string
  email: string | null
  type: RecipientType
  read: boolean
  readAt: string | null
  folder: MessageFolder
  deleted: boolean
}

export interface AttachmentDto {
  id: string
  filename: string
  contentType: string
  size: number
  downloadUrl: string
}

export interface MessageSummaryDto {
  id: string
  subject: string
  preview: string
  senderId: string
  senderDisplayName: string | null
  senderEmail: string | null
  recipientLabels: string[]
  attachmentCount: number
  read: boolean
  draft: boolean
  sentAt: string | null
  createdAt: string
  threadId: string | null
}

export interface MessageDto {
  id: string
  subject: string
  body: string
  senderId: string
  senderDisplayName: string | null
  senderEmail: string | null
  recipients: RecipientDto[]
  attachments: AttachmentDto[]
  groupIds: string[]
  parentMessageId: string | null
  threadId: string | null
  draft: boolean
  currentFolder: MessageFolder
  sentAt: string | null
  createdAt: string
}

export interface FolderCountsDto {
  inboxTotal: number
  inboxUnread: number
  sentTotal: number
  drafts: number
  trash: number
}

export interface GroupDto {
  id: string
  name: string
  description: string | null
  memberCount: number
  memberIds: string[]
  createdBy: string
  createdAt: string
  updatedAt?: string | null
}

export interface AdminStatsDto {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalAdmins: number
  totalMessages: number
  totalGroups: number
  activeUsers: number
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  code: string
  message: string
  path: string
  violations?: { field: string; message: string }[]
}
