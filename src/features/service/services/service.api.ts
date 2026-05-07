import { api } from '@/lib/api'
import type { ApiResponse, CreateServiceCatalogPayload, ServiceCatalogItem, UpdateServiceCatalogPayload } from '@/types/api'

export async function getServices(branchId: string) {
  const response = await api.get<ApiResponse<ServiceCatalogItem[]>>(`/services?branchId=${branchId}`)
  return response.data.data
}

export async function createService(payload: CreateServiceCatalogPayload) {
  const response = await api.post<ApiResponse<ServiceCatalogItem>>('/services', payload)
  return response.data.data
}

export async function updateService(serviceId: string, payload: UpdateServiceCatalogPayload) {
  const response = await api.put<ApiResponse<ServiceCatalogItem>>(`/services/${serviceId}`, payload)
  return response.data.data
}
