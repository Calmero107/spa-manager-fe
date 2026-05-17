import { api } from '@/lib/api'
import type { ApiResponse } from '@/types/api'
import type { OperationalDashboard } from '@/types/api'

export async function getOperationalDashboard(branchId: string, date: string) {
  const response = await api.get<ApiResponse<OperationalDashboard>>('/dashboard/operational', {
    params: { branchId, date },
  })
  return response.data.data
}
