export type ApiResponse<T> = {
  code: string
  message: string
  data: T
  retryable?: boolean
  traceId?: string | null
}

export type AuthUser = {
  accountId: string
  branchId: string
  staffId: string | null
  username: string
  role: string
  status: string
}

export type LoginResponse = {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  user: AuthUser
}

export type Customer = {
  id: string
  branchId: string
  phone: string
  name: string
  createdAt: string
  updatedAt: string | null
  version: number
}

export type AvailableSlot = {
  slotId: string
  startTime: string
  endTime: string
  staffId: string
  staffName: string
  roomId: string
  roomName: string
  equipment: Array<{
    equipmentId: string
    quantity: number
  }>
}
