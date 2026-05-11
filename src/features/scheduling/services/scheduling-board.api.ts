import { api } from '@/lib/api'
import type { ApiResponse, AppointmentBoardItem } from '@/types/api'

export async function getAppointmentBoard(branchId: string, date: string) {
  const response = await api.get<ApiResponse<AppointmentBoardItem[]>>('/appointments/board', {
    params: { branchId, date },
  })
  return response.data.data
}
