import { api } from '@/lib/api'
import type { ApiResponse, CreateStaffPayload, Staff, UpdateStaffPayload } from '@/types/api'

export async function getStaff(branchId: string, params?: { role?: string; status?: string }) {
  const search = new URLSearchParams({ branchId })
  if (params?.role) search.set('role', params.role)
  if (params?.status) search.set('status', params.status)

  const response = await api.get<ApiResponse<Staff[]>>(`/staff?${search.toString()}`)
  return response.data.data
}

export async function createStaff(payload: CreateStaffPayload) {
  const response = await api.post<ApiResponse<Staff>>('/staff', payload)
  return response.data.data
}

export async function updateStaff(staffId: string, payload: UpdateStaffPayload) {
  const response = await api.put<ApiResponse<Staff>>(`/staff/${staffId}`, payload)
  return response.data.data
}
