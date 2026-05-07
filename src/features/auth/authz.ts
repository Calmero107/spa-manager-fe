export const ROLE_GROUPS = {
  accountManagers: ['OWNER', 'MANAGER'] as const,
  customerManagers: ['OWNER', 'MANAGER', 'RECEPTIONIST'] as const,
  treatmentPlanManagers: ['OWNER', 'MANAGER', 'RECEPTIONIST'] as const,
  schedulingOperators: ['OWNER', 'MANAGER', 'RECEPTIONIST'] as const,
  appointmentOperators: ['OWNER', 'MANAGER', 'RECEPTIONIST'] as const,
  appointmentViewers: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TECHNICIAN'] as const,
  sessionCompletionOperators: ['OWNER', 'MANAGER', 'TECHNICIAN'] as const,
  resourceManagers: ['OWNER', 'MANAGER'] as const,
} as const

export function hasRole(userRole: string | null | undefined, allowedRoles: readonly string[]) {
  return allowedRoles.includes(userRole ?? '')
}

export function canManageAccounts(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.accountManagers)
}

export function canManageCustomers(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.customerManagers)
}

export function canManageTreatmentPlans(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.treatmentPlanManagers)
}

export function canScheduleSessions(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.schedulingOperators)
}

export function canOperateAppointments(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.appointmentOperators)
}

export function canViewAppointments(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.appointmentViewers)
}

export function canCompleteSessions(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.sessionCompletionOperators)
}

export function canManageResources(userRole: string | null | undefined) {
  return hasRole(userRole, ROLE_GROUPS.resourceManagers)
}
