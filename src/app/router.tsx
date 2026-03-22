import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/app/DashboardPage'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { CustomersPage } from '@/features/customer/pages/CustomersPage'
import { AppointmentLifecyclePage } from '@/features/appointment/pages/AppointmentLifecyclePage'
import { SchedulingPage } from '@/features/scheduling/pages/SchedulingPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'scheduling', element: <SchedulingPage /> },
      { path: 'appointments/lifecycle', element: <AppointmentLifecyclePage /> },
    ],
  },
])
