import { api } from '@/lib/api'
import type { ApiResponse, CreateEquipmentPayload, Equipment, UpdateEquipmentPayload } from '@/types/api'

export async function getEquipment(branchId: string) {
  const response = await api.get<ApiResponse<Equipment[]>>(`/equipment?branchId=${branchId}`)
  return response.data.data
}

export async function createEquipment(payload: CreateEquipmentPayload) {
  const response = await api.post<ApiResponse<Equipment>>('/equipment', payload)
  return response.data.data
}

export async function updateEquipment(equipmentId: string, payload: UpdateEquipmentPayload) {
  const response = await api.put<ApiResponse<Equipment>>(`/equipment/${equipmentId}`, payload)
  return response.data.data
}
