import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { canManageAccounts, canManageTreatmentPlans, canOperateAppointments, canScheduleSessions } from '@/features/auth/authz'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', visible: () => true },
  { to: '/customers', label: 'Customers', visible: () => true },
  { to: '/treatment-plans', label: 'Treatment Plans', visible: canManageTreatmentPlans },
  { to: '/scheduling', label: 'Scheduling', visible: canScheduleSessions },
  { to: '/appointments/detail', label: 'Appointment Detail', visible: canOperateAppointments },
  { to: '/appointments/lifecycle', label: 'Appointment Lifecycle', visible: canOperateAppointments },
  { to: '/settings/accounts', label: 'Staff Accounts', visible: canManageAccounts },
  { to: '/settings/password', label: 'Change Password', visible: () => true },
]

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="w-64 border-r border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Spa Manager</p>
            <h1 className="mt-2 text-2xl font-semibold">Frontend Base</h1>
          </div>
          <nav className="space-y-2">
            {navItems.filter((item) => item.visible(user?.role)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-4 py-3 text-sm transition',
                    isActive ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <header className="mb-8 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4">
            <div>
              <p className="text-sm text-slate-400">Signed in as</p>
              <p className="font-medium">{user?.username} · {user?.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Logout
            </button>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
