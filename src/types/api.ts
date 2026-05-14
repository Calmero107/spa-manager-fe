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

export type StaffAccount = {
  id: string
  branchId: string
  staffId: string | null
  staffName: string | null
  username: string
  role: string
  status: string
  createdAt: string
  updatedAt: string | null
  version: number
}

export type Customer = {
  id: string
  branchId: string
  phone: string
  name: string
  note: string | null
  warningFlag: boolean
  warningNote: string | null
  createdAt: string
  updatedAt: string | null
  version: number
}

export type CreateCustomerPayload = {
  branchId: string
  phone: string
  name: string
  note?: string
  warningFlag?: boolean
  warningNote?: string
}

export type UpdateCustomerPayload = {
  branchId: string
  phone: string
  name: string
  note?: string
  warningFlag?: boolean
  warningNote?: string
}

export type CustomerAuditLog = {
  id: string
  action: string
  performedByAccountId: string | null
  payload: string
  createdAt: string
  version: number
}

export type CustomerHistory = {
  customerId: string
  branchId: string
  treatmentPlans: {
    planId: string
    status: string
    totalPrice: number
    createdAt: string
    updatedAt: string | null
    version: number
  }[]
  sessions: {
    sessionId: string
    planId: string
    sequenceNo: number
    serviceName: string
    status: string
    duration: number
    price: number
    createdAt: string
    updatedAt: string | null
    version: number
  }[]
  appointments: {
    appointmentId: string
    sessionId: string
    planId: string
    appointmentStatus: string
    sessionStatus: string
    staffId: string
    staffName: string
    roomId: string
    roomName: string
    startTime: string
    endTime: string
    createdAt: string
    updatedAt: string | null
    version: number
  }[]
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

export type UpdateTreatmentPlanPayload = {
  branchId: string
  customerId: string
  serviceIds: string[]
}

export type EquipmentAllocation = {
  equipmentId: string
  quantity: number
}

export type Staff = {
  id: string
  branchId: string
  name: string
  role: string
  status: string
  createdAt: string
  updatedAt: string | null
  version: number
}

export type CreateStaffPayload = {
  branchId: string
  name: string
  role: string
  status: string
}

export type UpdateStaffPayload = {
  branchId: string
  name: string
  role: string
  status: string
}

export type ServiceCatalogItem = {
  id: string
  branchId: string
  name: string
  duration: number
  price: number
  createdAt: string
  updatedAt: string | null
  version: number
}

export type CreateServiceCatalogPayload = {
  branchId: string
  name: string
  duration: number
  price: number
}

export type UpdateServiceCatalogPayload = {
  branchId: string
  name: string
  duration: number
  price: number
}

export type Room = {
  id: string
  branchId: string
  name: string
  status: string
  createdAt: string
  updatedAt: string | null
  version: number
}

export type CreateRoomPayload = {
  branchId: string
  name: string
  status: string
}

export type UpdateRoomPayload = {
  branchId: string
  name: string
  status: string
}

export type Equipment = {
  id: string
  branchId: string
  name: string
  quantity: number
  createdAt: string
  updatedAt: string | null
  version: number
}

export type CreateEquipmentPayload = {
  branchId: string
  name: string
  quantity: number
}

export type UpdateEquipmentPayload = {
  branchId: string
  name: string
  quantity: number
}

export type StaffSkill = {
  staffId: string
  skillCode: string
  level: number
}

export type UpsertStaffSkillPayload = {
  branchId: string
  skillCode: string
  level: number
}

export type ServiceResourceRequirement = {
  serviceId: string
  resourceType: string
  resourceCode: string
  quantity: number
}

export type UpsertServiceResourceRequirementPayload = {
  branchId: string
  resourceType: string
  resourceCode: string
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

export type AppointmentBoardItem = {
  appointmentId: string
  sessionId: string
  planId: string
  customerId: string
  customerName: string | null
  staffId: string
  staffName: string
  roomId: string
  roomName: string
  startTime: string
  endTime: string
  appointmentStatus: string
  sessionStatus: string
  version: number
}
