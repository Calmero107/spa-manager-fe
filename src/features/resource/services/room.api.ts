import { api } from '@/lib/api'
import type { ApiResponse, CreateRoomPayload, Room, UpdateRoomPayload } from '@/types/api'

export async function getRooms(branchId: string) {
  const response = await api.get<ApiResponse<Room[]>>(`/rooms?branchId=${branchId}`)
  return response.data.data
}

export async function createRoom(payload: CreateRoomPayload) {
  const response = await api.post<ApiResponse<Room>>('/rooms', payload)
  return response.data.data
}

export async function updateRoom(roomId: string, payload: UpdateRoomPayload) {
  const response = await api.put<ApiResponse<Room>>(`/rooms/${roomId}`, payload)
  return response.data.data
}
