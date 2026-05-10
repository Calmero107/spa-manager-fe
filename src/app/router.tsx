import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/app/DashboardPage'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { ROLE_GROUPS } from '@/features/auth/authz'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage'
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
import { EquipmentManagementPage } from '@/features/resource/pages/EquipmentManagementPage'
import { RoomManagementPage } from '@/features/resource/pages/RoomManagementPage'
import { ServiceRequirementManagementPage } from '@/features/resource/pages/ServiceRequirementManagementPage'
import { StaffSkillManagementPage } from '@/features/resource/pages/StaffSkillManagementPage'
import { ServiceCatalogManagementPage } from '@/features/service/pages/ServiceCatalogManagementPage'
import { StaffManagementPage } from '@/features/staff/pages/StaffManagementPage'

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
      {
        path: 'customers',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.customerManagers} forbiddenMessage="Only owner, manager, or receptionist accounts can access customer management."><CustomersPage /></ProtectedRoute>,
      },
      {
        path: 'customers/new',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.customerManagers} forbiddenMessage="Only owner, manager, or receptionist accounts can create customers."><CustomerCreatePage /></ProtectedRoute>,
      },
      {
        path: 'customers/:customerId',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.customerManagers} forbiddenMessage="Only owner, manager, or receptionist accounts can view customer details."><CustomerDetailPage /></ProtectedRoute>,
      },
      {
        path: 'treatment-plans',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.treatmentPlanManagers} forbiddenMessage="Only owner, manager, or receptionist accounts can access treatment plans."><TreatmentPlansPage /></ProtectedRoute>,
      },
      {
        path: 'treatment-plans/new',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.treatmentPlanManagers} forbiddenMessage="Only owner, manager, or receptionist accounts can create treatment plans."><TreatmentPlanCreatePage /></ProtectedRoute>,
      },
      {
        path: 'treatment-plans/:planId',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.treatmentPlanManagers} forbiddenMessage="Only owner, manager, or receptionist accounts can view treatment plan details."><TreatmentPlanDetailPage /></ProtectedRoute>,
      },
      {
        path: 'scheduling',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.schedulingOperators} forbiddenMessage="Only owner, manager, or receptionist accounts can access scheduling."><SchedulingPage /></ProtectedRoute>,
      },
      {
        path: 'appointments/detail',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.appointmentViewers} forbiddenMessage="Your current role does not have permission to view appointment details."><AppointmentDetailPage /></ProtectedRoute>,
      },
      {
        path: 'appointments/lifecycle',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.appointmentViewers} forbiddenMessage="Your current role does not have permission to access appointment lifecycle pages."><AppointmentLifecyclePage /></ProtectedRoute>,
      },
      {
        path: 'resources/staff',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.resourceManagers} forbiddenMessage="Only owner and manager accounts can manage staff resources."><StaffManagementPage /></ProtectedRoute>,
      },
      {
        path: 'resources/services',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.resourceManagers} forbiddenMessage="Only owner and manager accounts can manage service catalogs."><ServiceCatalogManagementPage /></ProtectedRoute>,
      },
      {
        path: 'resources/rooms',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.resourceManagers} forbiddenMessage="Only owner and manager accounts can manage rooms."><RoomManagementPage /></ProtectedRoute>,
      },
      {
        path: 'resources/equipment',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.resourceManagers} forbiddenMessage="Only owner and manager accounts can manage equipment."><EquipmentManagementPage /></ProtectedRoute>,
      },
      {
        path: 'resources/staff-skills',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.resourceManagers} forbiddenMessage="Only owner and manager accounts can manage staff skills."><StaffSkillManagementPage /></ProtectedRoute>,
      },
      {
        path: 'resources/service-requirements',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.resourceManagers} forbiddenMessage="Only owner and manager accounts can manage service requirements."><ServiceRequirementManagementPage /></ProtectedRoute>,
      },
      {
        path: 'settings/accounts',
        element: <ProtectedRoute allowedRoles={ROLE_GROUPS.accountManagers} forbiddenMessage="Only owner and manager accounts can manage staff accounts."><StaffAccountsPage /></ProtectedRoute>,
      },
      {
        path: 'settings/password',
        element: <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>,
      },
    ],
  },
])
