import { api } from '@/lib/api'
import type { ApiResponse, ServiceResourceRequirement, UpsertServiceResourceRequirementPayload } from '@/types/api'

export async function getServiceRequirements(serviceId: string) {
  const response = await api.get<ApiResponse<ServiceResourceRequirement[]>>(`/services/${serviceId}/requirements`)
  return response.data.data
}

export async function upsertServiceRequirement(serviceId: string, payload: UpsertServiceResourceRequirementPayload) {
  const response = await api.post<ApiResponse<ServiceResourceRequirement>>(`/services/${serviceId}/requirements`, payload)
  return response.data.data
}

export async function deleteServiceRequirement(serviceId: string, branchId: string, resourceType: string, resourceCode: string) {
  await api.delete<ApiResponse<void>>(`/services/${serviceId}/requirements`, {
    params: { branchId, resourceType, resourceCode },
  })
}
