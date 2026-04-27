const ACCOUNT_MANAGEMENT_ROLES = ['OWNER', 'MANAGER'] as const
const TREATMENT_PLAN_ROLES = ['OWNER', 'MANAGER', 'RECEPTIONIST'] as const
const SCHEDULING_ROLES = ['OWNER', 'MANAGER', 'RECEPTIONIST'] as const
const APPOINTMENT_ROLES = ['OWNER', 'MANAGER', 'RECEPTIONIST'] as const
const SESSION_COMPLETION_ROLES = ['OWNER', 'MANAGER', 'TECHNICIAN'] as const

export function hasRole(userRole: string | null | undefined, allowedRoles: readonly string[]) {
  return allowedRoles.includes(userRole ?? '')
}

export function canManageAccounts(userRole: string | null | undefined) {
  return hasRole(userRole, ACCOUNT_MANAGEMENT_ROLES)
}

export function canManageTreatmentPlans(userRole: string | null | undefined) {
  return hasRole(userRole, TREATMENT_PLAN_ROLES)
}

export function canScheduleSessions(userRole: string | null | undefined) {
  return hasRole(userRole, SCHEDULING_ROLES)
}

export function canOperateAppointments(userRole: string | null | undefined) {
  return hasRole(userRole, APPOINTMENT_ROLES)
}

export function canCompleteSessions(userRole: string | null | undefined) {
  return hasRole(userRole, SESSION_COMPLETION_ROLES)
}
