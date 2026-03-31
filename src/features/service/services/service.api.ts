import { api } from '@/lib/api'
import type { ApiResponse } from '@/types/api'

export type ServiceItem = {
  id: string
  name: string
  duration: number
  price: number
}

export async function getServices(branchId: string) {
  const response = await api.get<ApiResponse<ServiceItem[]>>(`/services?branchId=${branchId}`)
  return response.data.data
}
