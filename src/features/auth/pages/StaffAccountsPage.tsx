import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  createStaffAccount,
  getStaffAccounts,
  resetStaffAccountPassword,
  updateStaffAccount,
} from '@/features/auth/services/account.api'
import { getStaff } from '@/features/staff/services/staff.api'

const createAccountSchema = z.object({
  staffId: z.string().min(1, 'Staff member is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
})

const updateAccountSchema = z.object({
  accountId: z.string().min(1, 'Select an account first'),
  role: z.string().min(1, 'Role is required'),
  status: z.string().min(1, 'Status is required'),
})

const resetPasswordSchema = z.object({
  accountId: z.string().min(1, 'Select an account first'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
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

  const accountsQuery = useQuery({
    queryKey: ['staff-accounts', branchId],
    queryFn: () => getStaffAccounts(branchId!),
    enabled: Boolean(branchId),
  })

  const staffQuery = useQuery({
    queryKey: ['staff', branchId, 'accounts-page'],
    queryFn: () => getStaff(branchId!),
    enabled: Boolean(branchId),
  })

  const createForm = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      staffId: '',
      username: '',
      password: '',
      role: 'TECHNICIAN',
    },
  })

  const updateForm = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      accountId: '',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
    },
  })

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      accountId: '',
      newPassword: '',
    },
  })

  const selectedAccount = accountsQuery.data?.find((account) => account.id === selectedAccountId) ?? null

  const staffWithoutAccounts = useMemo(() => {
    const accounts = accountsQuery.data ?? []
    const linkedStaffIds = new Set(accounts.map((account) => account.staffId).filter(Boolean))
    return (staffQuery.data ?? []).filter((staff) => !linkedStaffIds.has(staff.id))
  }, [accountsQuery.data, staffQuery.data])

  const refreshAccounts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['staff-accounts', branchId] })
  }

  const createMutation = useMutation({
    mutationFn: (values: CreateAccountFormValues) =>
      createStaffAccount({
        branchId: branchId!,
        staffId: values.staffId,
        username: values.username,
        password: values.password,
        role: values.role,
      }),
    onSuccess: async (account) => {
      await refreshAccounts()
      setSelectedAccountId(account.id)
      updateForm.reset({
        accountId: account.id,
        role: account.role,
        status: account.status,
      })
      resetPasswordForm.reset({ accountId: account.id, newPassword: '' })
      createForm.reset({ staffId: '', username: '', password: '', role: 'TECHNICIAN' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: UpdateAccountFormValues) =>
      updateStaffAccount(values.accountId, {
        branchId: branchId!,
        role: values.role,
        status: values.status,
      }),
    onSuccess: async (account) => {
      await refreshAccounts()
      setSelectedAccountId(account.id)
      updateForm.reset({ accountId: account.id, role: account.role, status: account.status })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      resetStaffAccountPassword(values.accountId, {
        branchId: branchId!,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      resetPasswordForm.reset({ accountId: selectedAccountId, newPassword: '' })
    },
  })

  const selectAccount = (accountId: string) => {
    setSelectedAccountId(accountId)
    const account = accountsQuery.data?.find((item) => item.id === accountId)
    if (!account) return
    updateForm.reset({
      accountId: account.id,
      role: account.role,
      status: account.status,
    })
    resetPasswordForm.reset({
      accountId: account.id,
      newPassword: '',
    })
  }

  return (
    <div className="space-y-6">
      <PageCard title="Staff Accounts" description="Full account management flow for owner and manager roles in the current branch.">
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          <p>
            Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span> to manage staff accounts.
          </p>
        </div>

        {accountsQuery.isLoading ? <p className="text-slate-400">Loading staff accounts...</p> : null}
        {accountsQuery.isError ? <p className="text-rose-400">Failed to load staff accounts.</p> : null}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {(accountsQuery.data ?? []).map((account) => {
              const isSelected = account.id === selectedAccountId
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => selectAccount(account.id)}
                  className={`w-full rounded-2xl border p-5 text-left transition ${isSelected ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{account.username}</h3>
                      <p className="mt-1 text-sm text-slate-400">{account.staffName ?? 'Unlinked staff'}</p>
                    </div>
                    <StatusBadge value={account.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                    <p>Role: <span className="text-white">{account.role}</span></p>
                    <p>Version: <span className="text-white">{account.version}</span></p>
                    <p className="md:col-span-2">Staff ID: <span className="font-mono text-slate-400">{account.staffId ?? 'N/A'}</span></p>
                  </div>
                </button>
              )
            })}
            {!accountsQuery.isLoading && (accountsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-slate-400">No staff accounts found for this branch yet.</p>
            ) : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-white">Selected account</p>
            {selectedAccount ? (
              <>
                <p className="text-sm text-slate-300">{selectedAccount.username} · {selectedAccount.staffName ?? 'Unlinked staff'}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={selectedAccount.status} />
                  <StatusBadge value={selectedAccount.role} />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Pick an account from the list to update role/status or reset its password.</p>
            )}
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <PageCard title="Create account" description="Create a new staff account linked to an existing staff member in this branch.">
          <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Staff member</label>
              <select
                {...createForm.register('staffId')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              >
                <option value="">Select staff</option>
                {staffWithoutAccounts.map((staff) => (
                  <option key={staff.id} value={staff.id}>{staff.name} · {staff.role}</option>
                ))}
              </select>
              {createForm.formState.errors.staffId ? <p className="mt-2 text-sm text-rose-400">{createForm.formState.errors.staffId.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Username</label>
              <input
                {...createForm.register('username')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
              {createForm.formState.errors.username ? <p className="mt-2 text-sm text-rose-400">{createForm.formState.errors.username.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Initial password</label>
              <input
                type="password"
                {...createForm.register('password')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
              {createForm.formState.errors.password ? <p className="mt-2 text-sm text-rose-400">{createForm.formState.errors.password.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Role</label>
              <select
                {...createForm.register('role')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              >
                {accountRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            {staffQuery.isLoading ? <p className="text-sm text-slate-400">Loading staff...</p> : null}
            {createMutation.isError ? <p className="text-sm text-rose-400">Failed to create account.</p> : null}
            {staffWithoutAccounts.length === 0 ? <p className="text-sm text-amber-300">All staff in this branch already have linked accounts.</p> : null}

            <button
              type="submit"
              disabled={createMutation.isPending || !branchId || staffWithoutAccounts.length === 0}
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? 'Creating...' : 'Create account'}
            </button>
          </form>
        </PageCard>

        <PageCard title="Update account" description="Update role or activation status for the selected account.">
          <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Role</label>
              <select
                {...updateForm.register('role')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              >
                {accountRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Status</label>
              <select
                {...updateForm.register('status')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              >
                {accountStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            {updateForm.formState.errors.accountId ? <p className="text-sm text-rose-400">{updateForm.formState.errors.accountId.message}</p> : null}
            {updateMutation.isError ? <p className="text-sm text-rose-400">Failed to update account.</p> : null}
            {updateMutation.isSuccess ? <p className="text-sm text-emerald-300">Account updated successfully.</p> : null}

            <button
              type="submit"
              disabled={updateMutation.isPending || !selectedAccountId}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Updating...' : 'Save account changes'}
            </button>
          </form>
        </PageCard>

        <PageCard title="Reset password" description="Reset the password for the selected account inside the current branch.">
          <form className="space-y-4" onSubmit={resetPasswordForm.handleSubmit((values) => resetPasswordMutation.mutate(values))}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">New password</label>
              <input
                type="password"
                {...resetPasswordForm.register('newPassword')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
              {resetPasswordForm.formState.errors.newPassword ? <p className="mt-2 text-sm text-rose-400">{resetPasswordForm.formState.errors.newPassword.message}</p> : null}
            </div>

            {resetPasswordForm.formState.errors.accountId ? <p className="text-sm text-rose-400">{resetPasswordForm.formState.errors.accountId.message}</p> : null}
            {resetPasswordMutation.isError ? <p className="text-sm text-rose-400">Failed to reset password.</p> : null}
            {resetPasswordMutation.isSuccess ? <p className="text-sm text-emerald-300">Password reset successfully.</p> : null}

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending || !selectedAccountId}
              className="w-full rounded-xl border border-amber-700 px-4 py-3 font-medium text-amber-200 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </PageCard>
      </div>
    </div>
  )
}
