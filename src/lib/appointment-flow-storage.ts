const KEY = 'spa_manager_latest_appointment_flow'

type AppointmentFlowState = {
  appointmentId: string
  sessionId: string
}

export const appointmentFlowStorage = {
  get(): AppointmentFlowState | null {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as AppointmentFlowState
    } catch {
      return null
    }
  },
  set(value: AppointmentFlowState) {
    localStorage.setItem(KEY, JSON.stringify(value))
  },
  clear() {
    localStorage.removeItem(KEY)
  },
}
