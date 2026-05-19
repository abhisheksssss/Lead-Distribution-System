export type Service = {
  id: number
  name: string
}

export type CreateLeadInput = {
  name: string
  phoneNumber: string
  city: string
  serviceId: number
  description: string
}

export type AssignmentSummary = {
  providerId: number
  providerName: string
}

export type CreateLeadResult = {
  leadId: number
  createdAt: string
  assignedProviders: AssignmentSummary[]
}

export type ProviderLead = {
  leadId: number
  customerName: string
  phoneNumber: string
  city: string
  serviceName: string
  description: string
  assignedAt: string
}

export type ProviderDashboardRow = {
  providerId: number
  providerName: string
  quotaLimit: number
  leadsUsed: number
  remainingQuota: number
  assignedLeads: ProviderLead[]
}

export type DashboardSnapshot = {
  quotaMonth: string
  updatedAt: string
  providers: ProviderDashboardRow[]
}

export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_LEAD'
  | 'INSUFFICIENT_CAPACITY'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  status: number
  code: AppErrorCode

  constructor(message: string, status = 400, code: AppErrorCode = 'VALIDATION_ERROR') {
    super(message)
    this.status = status
    this.code = code
  }
}
