import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/app/DashboardPage'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { StaffAccountsPage } from '@/features/auth/pages/StaffAccountsPage'
import { CustomersPage } from '@/features/customer/pages/CustomersPage'
import { CustomerCreatePage } from '@/features/customer/pages/CustomerCreatePage'
import { CustomerDetailPage } from '@/features/customer/pages/CustomerDetailPage'
import { AppointmentDetailPage } from '@/features/appointment/pages/AppointmentDetailPage'
import { AppointmentLifecyclePage } from '@/features/appointment/pages/AppointmentLifecyclePage'
import { TreatmentPlanCreatePage } from '@/features/treatment-plan/pages/TreatmentPlanCreatePage'
import { TreatmentPlanDetailPage } from '@/features/treatment-plan/pages/TreatmentPlanDetailPage'
import { TreatmentPlansPage } from '@/features/treatment-plan/pages/TreatmentPlansPage'
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
      { path: 'customers/new', element: <CustomerCreatePage /> },
      { path: 'customers/:customerId', element: <CustomerDetailPage /> },
      {
        path: 'treatment-plans',
        element: <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><TreatmentPlansPage /></ProtectedRoute>,
      },
      {
        path: 'treatment-plans/new',
        element: <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><TreatmentPlanCreatePage /></ProtectedRoute>,
      },
      {
        path: 'treatment-plans/:planId',
        element: <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><TreatmentPlanDetailPage /></ProtectedRoute>,
      },
      {
        path: 'scheduling',
        element: <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><SchedulingPage /></ProtectedRoute>,
      },
      {
        path: 'appointments/detail',
        element: <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST', 'TECHNICIAN']}><AppointmentDetailPage /></ProtectedRoute>,
      },
      {
        path: 'appointments/lifecycle',
        element: <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST', 'TECHNICIAN']}><AppointmentLifecyclePage /></ProtectedRoute>,
      },
      {
        path: 'settings/accounts',
        element: <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}><StaffAccountsPage /></ProtectedRoute>,
      },
    ],
  },
])
