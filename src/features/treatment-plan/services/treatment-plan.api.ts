import { api } from '@/lib/api'
import type { ApiResponse, CreateTreatmentPlanPayload, TreatmentPlan } from '@/types/api'

export async function getTreatmentPlans(branchId: string) {
  const response = await api.get<ApiResponse<TreatmentPlan[]>>(`/treatment-plans?branchId=${branchId}`)
  return response.data.data
}

export async function getTreatmentPlan(planId: string) {
  const response = await api.get<ApiResponse<TreatmentPlan>>(`/treatment-plans/${planId}`)
  return response.data.data
}

export async function createTreatmentPlan(payload: CreateTreatmentPlanPayload) {
  const response = await api.post<ApiResponse<TreatmentPlan>>('/treatment-plans', payload)
  return response.data.data
}
