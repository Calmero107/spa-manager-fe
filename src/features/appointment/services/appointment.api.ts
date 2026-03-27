import { api } from '@/lib/api'
import type { ApiResponse, AppointmentDetail } from '@/types/api'

export async function getAppointmentDetail(appointmentId: string) {
  const response = await api.get<ApiResponse<AppointmentDetail>>(`/appointments/${appointmentId}`)
  return response.data.data
}
