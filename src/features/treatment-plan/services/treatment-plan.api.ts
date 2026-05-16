import { api } from '@/lib/api'
import type { ApiResponse, CreateTreatmentPlanPayload, TreatmentPlan, TreatmentPlanAuditLog, UpdateTreatmentPlanPayload } from '@/types/api'

export async function getTreatmentPlans(branchId: string, filters?: { customerId?: string; status?: string }) {
  const search = new URLSearchParams({ branchId })
  if (filters?.customerId?.trim()) {
    search.set('customerId', filters.customerId.trim())
  }
  if (filters?.status?.trim()) {
    search.set('status', filters.status.trim())
  }

  const response = await api.get<ApiResponse<TreatmentPlan[]>>(`/treatment-plans?${search.toString()}`)
  return response.data.data
}

export async function getTreatmentPlan(planId: string) {
  const response = await api.get<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}`)
  return response.data.data
}

export async function getTreatmentPlanAuditHistory(planId: string) {
  const response = await api.get<ApiResponse<TreatmentPlanAuditLog[]>>(`/treatment-plans/${planId}/audit`)
  return response.data.data
}

export async function createTreatmentPlan(payload: CreateTreatmentPlanPayload) {
  const response = await api.post<ApiResponse<TreatmentPlan>>('/treatment-plans', payload)
  return response.data.data
}

export async function updateTreatmentPlan(planId: string, payload: UpdateTreatmentPlanPayload) {
  const response = await api.put<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}`, payload)
  return response.data.data
}
