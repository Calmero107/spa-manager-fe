import { api } from '@/lib/api'
import type { ApiResponse, Staff } from '@/types/api'

export async function getStaff(branchId: string, params?: { role?: string; status?: string }) {
  const search = new URLSearchParams({ branchId })
  if (params?.role) search.set('role', params.role)
  if (params?.status) search.set('status', params.status)

  const response = await api.get<ApiResponse<Staff[]>>(`/staff?${search.toString()}`)
  return response.data.data
}
