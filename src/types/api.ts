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

export type CreateCustomerPayload = {
  branchId: string
  phone: string
  name: string
}

export type SessionSummary = {
  id: string
  sequenceNo: number
  status: string
  serviceName: string
  duration: number
  price: number
  branchId: string
  version: number
}

export type TreatmentPlan = {
  id: string
  customerId: string
  branchId: string
  status: string
  totalPrice: number
  createdAt: string
  updatedAt: string | null
  version: number
  sessions: SessionSummary[]
}

export type CreateTreatmentPlanPayload = {
  branchId: string
  customerId: string
  serviceIds: string[]
}

export type EquipmentAllocation = {
  equipmentId: string
  quantity: number
}

export type AvailableSlot = {
  slotId: string
  startTime: string
  endTime: string
  staffId: string
  staffName: string
  roomId: string
  roomName: string
  equipment: EquipmentAllocation[]
}

export type SchedulingLockResponse = {
  lockId: string
  expiresAt: string
}

export type ScheduleSessionResponse = {
  appointmentId: string
  sessionId: string
  status: string
  startTime: string
  endTime: string
  staffId: string
  roomId: string
  equipment: EquipmentAllocation[]
  version: number
}

export type AppointmentDetail = {
  id: string
  sessionId: string
  staffId: string
  staffName: string
  roomId: string
  roomName: string
  startTime: string
  endTime: string
  status: string
  branchId: string
  sessionStatus: string
  version: number
}
