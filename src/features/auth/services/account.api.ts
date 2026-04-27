import { api } from '@/lib/api'
import type { ApiResponse } from '@/types/api'
import type { StaffAccount } from '@/types/api'

export async function getStaffAccounts(branchId: string) {
  const response = await api.get<ApiResponse<StaffAccount[]>>('/auth/accounts', {
    params: { branchId },
  })
  return response.data.data
}
