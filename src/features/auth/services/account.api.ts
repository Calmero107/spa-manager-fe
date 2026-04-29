import { api } from '@/lib/api'
import type { ApiResponse, StaffAccount } from '@/types/api'

export type CreateStaffAccountPayload = {
  branchId: string
  staffId: string
  username: string
  password: string
  role: string
}

export type UpdateStaffAccountPayload = {
  branchId: string
  role: string
  status: string
}

export type ResetPasswordPayload = {
  branchId: string
  newPassword: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export async function getStaffAccounts(branchId: string) {
  const response = await api.get<ApiResponse<StaffAccount[]>>('/auth/accounts', {
    params: { branchId },
  })
  return response.data.data
}

export async function createStaffAccount(payload: CreateStaffAccountPayload) {
  const response = await api.post<ApiResponse<StaffAccount>>('/auth/accounts', payload)
  return response.data.data
}

export async function updateStaffAccount(accountId: string, payload: UpdateStaffAccountPayload) {
  const response = await api.put<ApiResponse<StaffAccount>>(`/auth/accounts/${accountId}`, payload)
  return response.data.data
}

export async function resetStaffAccountPassword(accountId: string, payload: ResetPasswordPayload) {
  await api.post<ApiResponse<void>>(`/auth/accounts/${accountId}/reset-password`, payload)
}

export async function changeMyPassword(payload: ChangePasswordPayload) {
  await api.post<ApiResponse<void>>('/auth/me/change-password', payload)
}
