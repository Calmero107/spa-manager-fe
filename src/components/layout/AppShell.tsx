import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { canManageAccounts, canManageCustomers, canManageResources, canManageTreatmentPlans, canScheduleSessions, canViewAppointments } from '@/features/auth/authz'
import { cn } from '@/lib/cn'

const viRoles: Record<string, string> = {
  OWNER: 'Chủ cơ sở',
  MANAGER: 'Quản lý',
  RECEPTIONIST: 'Lễ tân',
  TECHNICIAN: 'Kỹ thuật viên',
}

const navSections = [
  {
    label: 'Tổng quan',
    items: [
      { to: '/dashboard', label: 'Dashboard', visible: () => true },
    ],
  },
  {
    label: 'Khách hàng & Dịch vụ',
    items: [
      { to: '/customers', label: 'Khách hàng', visible: canManageCustomers },
      { to: '/treatment-plans', label: 'Liệu trình', visible: canManageTreatmentPlans },
    ],
  },
  {
    label: 'Lịch hẹn',
    items: [
      { to: '/scheduling', label: 'Đặt lịch', visible: canScheduleSessions },
      { to: '/scheduling/board', label: 'Bảng lịch hẹn', visible: canViewAppointments },
      { to: '/appointments/detail', label: 'Chi tiết lịch hẹn', visible: canViewAppointments },
      { to: '/appointments/lifecycle', label: 'Quản lý lịch hẹn', visible: canViewAppointments },
    ],
  },
  {
    label: 'Quản lý nguồn lực',
    items: [
      { to: '/resources/staff', label: 'Quản lý nhân viên', visible: canManageResources },
      { to: '/resources/services', label: 'Danh mục dịch vụ', visible: canManageResources },
      { to: '/resources/rooms', label: 'Quản lý phòng', visible: canManageResources },
      { to: '/resources/equipment', label: 'Quản lý thiết bị', visible: canManageResources },
      { to: '/resources/staff-skills', label: 'Kỹ năng nhân viên', visible: canManageResources },
      { to: '/resources/service-requirements', label: 'Yêu cầu dịch vụ', visible: canManageResources },
    ],
  },
  {
    label: 'Cài đặt',
    items: [
      { to: '/settings/accounts', label: 'Tài khoản nhân viên', visible: canManageAccounts },
      { to: '/settings/password', label: 'Đổi mật khẩu', visible: () => true },
    ],
  },
]

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="w-72 border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-600">Spa Manager</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Quản lý Spa</h1>
          </div>
          <nav className="space-y-6">
            {navSections.map((section) => {
              const visibleItems = section.items.filter((item) => item.visible(user?.role))
              if (visibleItems.length === 0) return null
              return (
                <div key={section.label}>
                  <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.label}</p>
                  <div className="space-y-1">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-xl px-4 py-2.5 text-sm transition',
                            isActive ? 'bg-cyan-500 font-medium text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-10">
          <header className="mb-10 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-8 py-5 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Xin chào</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{user?.username} <span className="font-normal text-slate-500">· {viRoles[user?.role ?? ''] ?? user?.role}</span></p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Đăng xuất
            </button>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
