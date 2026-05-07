import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createStaff, getStaff, updateStaff } from '@/features/staff/services/staff.api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  status: z.string().min(1, 'Status is required'),
})

type FormValues = z.infer<typeof schema>

const roles = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TECHNICIAN'] as const
const statuses = ['ACTIVE', 'INACTIVE'] as const

export function StaffManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')

  const staffQuery = useQuery({
    queryKey: ['staff-management', branchId],
    queryFn: () => getStaff(branchId!),
    enabled: Boolean(branchId),
  })

  const createForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', role: 'TECHNICIAN', status: 'ACTIVE' },
  })
  const updateForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', role: 'TECHNICIAN', status: 'ACTIVE' },
  })

  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['staff-management', branchId] })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createStaff({ branchId: branchId!, ...values }),
    onSuccess: async (staff) => {
      await refresh()
      setSelectedStaffId(staff.id)
      createForm.reset({ name: '', role: 'TECHNICIAN', status: 'ACTIVE' })
      updateForm.reset({ name: staff.name, role: staff.role, status: staff.status })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => updateStaff(selectedStaffId, { branchId: branchId!, ...values }),
    onSuccess: async (staff) => {
      await refresh()
      updateForm.reset({ name: staff.name, role: staff.role, status: staff.status })
    },
  })

  const selectedStaff = staffQuery.data?.find((item) => item.id === selectedStaffId)

  return (
    <div className="space-y-6">
      <PageCard title="Staff management" description="Create and update staff resources for the active branch.">
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span>.
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {staffQuery.data?.map((staff) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => {
                  setSelectedStaffId(staff.id)
                  updateForm.reset({ name: staff.name, role: staff.role, status: staff.status })
                }}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedStaffId === staff.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{staff.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{staff.id}</p>
                  </div>
                  <StatusBadge value={staff.status} />
                </div>
                <p className="mt-3 text-sm text-slate-300">Role: <span className="text-white">{staff.role}</span></p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Selected staff</p>
            {selectedStaff ? <p className="mt-2">{selectedStaff.name} · {selectedStaff.role}</p> : <p className="mt-2 text-slate-400">Select a staff member to edit.</p>}
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageCard title="Create staff" description="Add a new staff resource to the active branch.">
          <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <input {...createForm.register('name')} placeholder="Staff name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <select {...createForm.register('role')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select {...createForm.register('status')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            {createMutation.isError ? <p className="text-sm text-rose-400">Failed to create staff.</p> : null}
            <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
              {createMutation.isPending ? 'Creating...' : 'Create staff'}
            </button>
          </form>
        </PageCard>

        <PageCard title="Update staff" description="Update role and status for the selected staff resource.">
          <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
            <input {...updateForm.register('name')} placeholder="Staff name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <select {...updateForm.register('role')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select {...updateForm.register('status')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            {updateMutation.isError ? <p className="text-sm text-rose-400">Failed to update staff.</p> : null}
            {updateMutation.isSuccess ? <p className="text-sm text-emerald-300">Staff updated successfully.</p> : null}
            <button type="submit" disabled={updateMutation.isPending || !selectedStaffId} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
              {updateMutation.isPending ? 'Saving...' : 'Save staff changes'}
            </button>
          </form>
        </PageCard>
      </div>
    </div>
  )
}
