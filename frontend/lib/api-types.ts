export type ApiUserRole = "Client" | "Technician" | "Admin"

export interface ApiUserDto {
  id: string
  fullName: string
  email: string
  role: ApiUserRole
  phoneNumber?: string | null
  department?: string | null
  avatarUrl?: string | null
}

export interface ApiAuthResponse {
  token: string
  user: ApiUserDto
}

export interface ApiCategoryResponse {
  id: number
  name: string
  description?: string | null
  subcategories: ApiSubcategoryResponse[]
}

export interface ApiSubcategoryResponse {
  id: number
  name: string
}

export type ApiTicketPriority = "Low" | "Medium" | "High" | "Critical"
export type ApiTicketStatus = "New" | "InProgress" | "WaitingForClient" | "Resolved" | "Closed"

export interface ApiTicketResponse {
  id: string
  title: string
  description: string
  categoryId: number
  categoryName: string
  subcategoryId?: number | null
  subcategoryName?: string | null
  priority: ApiTicketPriority
  status: ApiTicketStatus
  createdByUserId: string
  createdByName: string
  createdByEmail: string
  createdByPhoneNumber?: string | null
  createdByDepartment?: string | null
  assignedToUserId?: string | null
  assignedToName?: string | null
  assignedToEmail?: string | null
  assignedToPhoneNumber?: string | null
  createdAt: string
  updatedAt?: string | null
  dueDate?: string | null
}

export interface ApiTicketMessageDto {
  id: string
  authorUserId: string
  authorName: string
  authorEmail: string
  message: string
  createdAt: string
  status?: ApiTicketStatus | null
}

export interface ApiSystemSettingsResponse {
  appName: string
  supportEmail: string
  supportPhone: string
  defaultLanguage: "fa" | "en"
  defaultTheme: "light" | "dark" | "system"
  timezone: string
  defaultPriority: ApiTicketPriority
  defaultStatus: ApiTicketStatus
  responseSlaHours: number
  autoAssignEnabled: boolean
  allowClientAttachments: boolean
  maxAttachmentSizeMB: number
  emailNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
  notifyOnTicketCreated: boolean
  notifyOnTicketAssigned: boolean
  notifyOnTicketReplied: boolean
  notifyOnTicketClosed: boolean
  passwordMinLength: number
  require2FA: boolean
  sessionTimeoutMinutes: number
  allowedEmailDomains: string[]
}

export type ApiSystemSettingsUpdateRequest = ApiSystemSettingsResponse

export interface ApiUserPreferencesResponse {
  theme: "light" | "dark" | "system"
  fontSize: "sm" | "md" | "lg"
  language: "fa" | "en"
  direction: "rtl" | "ltr"
  timezone: string
  notifications: {
    emailEnabled: boolean
    pushEnabled: boolean
    smsEnabled: boolean
    desktopEnabled: boolean
  }
}

export type ApiUserPreferencesUpdateRequest = ApiUserPreferencesResponse

export interface ApiTechnicianResponse {
  id: string
  fullName: string
  email: string
  phone?: string | null
  department?: string | null
  isActive: boolean
  createdAt: string
}

export interface ApiTechnicianCreateRequest {
  fullName: string
  email: string
  phone?: string | null
  department?: string | null
  isActive?: boolean
}

export interface ApiTechnicianUpdateRequest {
  fullName: string
  email: string
  phone?: string | null
  department?: string | null
  isActive?: boolean
}

export interface ApiTechnicianStatusUpdateRequest {
  isActive: boolean
}

export interface ApiNotificationPreferencesResponse {
  emailEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
  desktopEnabled: boolean
}

export type ApiNotificationPreferencesUpdateRequest = ApiNotificationPreferencesResponse