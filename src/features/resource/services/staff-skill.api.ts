import { api } from '@/lib/api'
import type { ApiResponse, StaffSkill, UpsertStaffSkillPayload } from '@/types/api'

export async function getStaffSkills(staffId: string) {
  const response = await api.get<ApiResponse<StaffSkill[]>>(`/staff/${staffId}/skills`)
  return response.data.data
}

export async function upsertStaffSkill(staffId: string, payload: UpsertStaffSkillPayload) {
  const response = await api.post<ApiResponse<StaffSkill>>(`/staff/${staffId}/skills`, payload)
  return response.data.data
}

export async function deleteStaffSkill(staffId: string, branchId: string, skillCode: string) {
  await api.delete<ApiResponse<void>>(`/staff/${staffId}/skills`, {
    params: { branchId, skillCode },
  })
}
