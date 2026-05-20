import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createStaffAccount, getStaffAccounts, resetStaffAccountPassword, updateStaffAccount } from '@/features/auth/services/account.api'
import { getStaff } from '@/features/staff/services/staff.api'

const viRoles: Record<string, string> = { OWNER: 'Chủ cơ sở', MANAGER: 'Quản lý', RECEPTIONIST: 'Lễ tân', TECHNICIAN: 'Kỹ thuật viên' }

const createAccountSchema = z.object({
  staffId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.string().min(1, 'Vui lòng chọn vai trò'),
})
const updateAccountSchema = z.object({
  accountId: z.string().min(1, 'Vui lòng chọn tài khoản'),
  role: z.string().min(1, 'Vui lòng chọn vai trò'),
  status: z.string().min(1, 'Vui lòng chọn trạng thái'),
})
const resetPasswordSchema = z.object({
  accountId: z.string().min(1, 'Vui lòng chọn tài khoản'),
  newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type CreateAccountFormValues = z.infer<typeof createAccountSchema>
type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

const accountRoles = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TECHNICIAN'] as const
const accountStatuses = ['ACTIVE', 'INACTIVE'] as const

export function StaffAccountsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const branchId = user?.branchId
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  const accountsQuery = useQuery({ queryKey: ['staff-accounts', branchId], queryFn: () => getStaffAccounts(branchId!), enabled: Boolean(branchId) })
  const staffQuery = useQuery({ queryKey: ['staff', branchId, 'accounts-page'], queryFn: () => getStaff(branchId!), enabled: Boolean(branchId) })

  const createForm = useForm<CreateAccountFormValues>({ resolver: zodResolver(createAccountSchema), defaultValues: { staffId: '', username: '', password: '', role: 'TECHNICIAN' } })
  const updateForm = useForm<UpdateAccountFormValues>({ resolver: zodResolver(updateAccountSchema), defaultValues: { accountId: '', role: 'TECHNICIAN', status: 'ACTIVE' } })
  const resetPasswordForm = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { accountId: '', newPassword: '' } })

  const selectedAccount = accountsQuery.data?.find((account) => account.id === selectedAccountId) ?? null

  const staffWithoutAccounts = useMemo(() => {
    const accounts = accountsQuery.data ?? []
    const linkedStaffIds = new Set(accounts.map((account) => account.staffId).filter(Boolean))
    return (staffQuery.data ?? []).filter((staff) => !linkedStaffIds.has(staff.id))
  }, [accountsQuery.data, staffQuery.data])

  const refreshAccounts = async () => queryClient.invalidateQueries({ queryKey: ['staff-accounts', branchId] })

  const createMutation = useMutation({
    mutationFn: (values: CreateAccountFormValues) => createStaffAccount({ branchId: branchId!, staffId: values.staffId, username: values.username, password: values.password, role: values.role }),
    onSuccess: async (account) => { await refreshAccounts(); setSelectedAccountId(account.id); updateForm.reset({ accountId: account.id, role: account.role, status: account.status }); resetPasswordForm.reset({ accountId: account.id, newPassword: '' }); createForm.reset({ staffId: '', username: '', password: '', role: 'TECHNICIAN' }) },
  })
  const updateMutation = useMutation({
    mutationFn: (values: UpdateAccountFormValues) => updateStaffAccount(values.accountId, { branchId: branchId!, role: values.role, status: values.status }),
    onSuccess: async (account) => { await refreshAccounts(); setSelectedAccountId(account.id); updateForm.reset({ accountId: account.id, role: account.role, status: account.status }) },
  })
  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) => resetStaffAccountPassword(values.accountId, { branchId: branchId!, newPassword: values.newPassword }),
    onSuccess: () => { resetPasswordForm.reset({ accountId: selectedAccountId, newPassword: '' }) },
  })

  const selectAccount = (accountId: string) => {
    setSelectedAccountId(accountId)
    const account = accountsQuery.data?.find((item) => item.id === accountId)
    if (!account) return
    updateForm.reset({ accountId: account.id, role: account.role, status: account.status })
    resetPasswordForm.reset({ accountId: account.id, newPassword: '' })
  }

  return (
    <div className="space-y-8">
      <PageCard title="Tài khoản nhân viên">
        {accountsQuery.isLoading ? <LoadingSpinner message="Đang tải tài khoản nhân viên..." /> : null}
        {accountsQuery.isError ? <ErrorAlert message="Không thể tải tài khoản nhân viên." onRetry={() => accountsQuery.refetch()} /> : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {(accountsQuery.data ?? []).map((account) => (
              <button key={account.id} type="button" onClick={() => selectAccount(account.id)}
                className={`w-full rounded-2xl border p-5 text-left transition ${account.id === selectedAccountId ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{account.username}</h3>
                    <p className="mt-1 text-sm text-slate-500">{account.staffName ?? 'Chưa liên kết'}</p>
                  </div>
                  <StatusBadge value={account.status} />
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  <p>Vai trò: <span className="font-medium text-slate-900">{viRoles[account.role] ?? account.role}</span></p>
                </div>
              </button>
            ))}
            {!accountsQuery.isLoading && (accountsQuery.data?.length ?? 0) === 0 ? <EmptyState message="Chưa có tài khoản nhân viên nào." /> : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-slate-900">Tài khoản đang chọn</p>
            {selectedAccount ? (
              <>
                <p className="mt-2 text-slate-600">{selectedAccount.username} · {selectedAccount.staffName ?? 'Chưa liên kết'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge value={selectedAccount.status} />
                  <StatusBadge value={selectedAccount.role} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-slate-500">Chọn tài khoản từ danh sách để cập nhật.</p>
            )}
          </div>
        </div>
      </PageCard>

      <PageCard title="Thao tác tài khoản">
        <Tabs tabs={[
          { key: 'create', label: 'Tạo tài khoản', content: (
            <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nhân viên</label>
                <select {...createForm.register('staffId')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
                  <option value="">Chọn nhân viên</option>
                  {staffWithoutAccounts.map((staff) => (<option key={staff.id} value={staff.id}>{staff.name} · {viRoles[staff.role] ?? staff.role}</option>))}
                </select>
                {createForm.formState.errors.staffId ? <p className="mt-2 text-sm text-rose-600">{createForm.formState.errors.staffId.message}</p> : null}
              </div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Tên đăng nhập</label><input {...createForm.register('username')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />{createForm.formState.errors.username ? <p className="mt-2 text-sm text-rose-600">{createForm.formState.errors.username.message}</p> : null}</div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu khởi tạo</label><input type="password" {...createForm.register('password')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />{createForm.formState.errors.password ? <p className="mt-2 text-sm text-rose-600">{createForm.formState.errors.password.message}</p> : null}</div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Vai trò</label><select {...createForm.register('role')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">{accountRoles.map((role) => <option key={role} value={role}>{viRoles[role]}</option>)}</select></div>
              {staffQuery.isLoading ? <LoadingSpinner message="Đang tải nhân viên..." /> : null}
              {createMutation.isError ? <ErrorAlert message="Tạo tài khoản thất bại." /> : null}
              {staffWithoutAccounts.length === 0 ? <p className="text-sm text-amber-600">Tất cả nhân viên đều đã có tài khoản.</p> : null}
              <button type="submit" disabled={createMutation.isPending || !branchId || staffWithoutAccounts.length === 0} className="w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">{createMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
            </form>
          )},
          { key: 'update', label: 'Cập nhật', disabled: !selectedAccountId, content: (
            <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Vai trò</label><select {...updateForm.register('role')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">{accountRoles.map((role) => <option key={role} value={role}>{viRoles[role]}</option>)}</select></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label><select {...updateForm.register('status')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">{accountStatuses.map((s) => <option key={s} value={s}>{s === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}</option>)}</select></div>
              {updateMutation.isError ? <ErrorAlert message="Cập nhật tài khoản thất bại." /> : null}
              {updateMutation.isSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cập nhật thành công!</div> : null}
              <button type="submit" disabled={updateMutation.isPending || !selectedAccountId} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </form>
          )},
          { key: 'reset-password', label: 'Đặt lại mật khẩu', disabled: !selectedAccountId, content: (
            <form className="space-y-4" onSubmit={resetPasswordForm.handleSubmit((values) => resetPasswordMutation.mutate(values))}>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu mới</label><input type="password" {...resetPasswordForm.register('newPassword')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />{resetPasswordForm.formState.errors.newPassword ? <p className="mt-2 text-sm text-rose-600">{resetPasswordForm.formState.errors.newPassword.message}</p> : null}</div>
              {resetPasswordMutation.isError ? <ErrorAlert message="Đặt lại mật khẩu thất bại." /> : null}
              {resetPasswordMutation.isSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Đặt lại mật khẩu thành công!</div> : null}
              <button type="submit" disabled={resetPasswordMutation.isPending || !selectedAccountId} className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60">{resetPasswordMutation.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</button>
            </form>
          )},
        ]} />
      </PageCard>
    </div>
  )
}
