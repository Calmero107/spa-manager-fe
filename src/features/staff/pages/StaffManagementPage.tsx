import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { Tabs } from '@/components/ui/Tabs'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createStaff, getStaff, updateStaff } from '@/features/staff/services/staff.api'

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên'),
  role: z.string().min(1, 'Vui lòng chọn vai trò'),
  status: z.string().min(1, 'Vui lòng chọn trạng thái'),
})

type FormValues = z.infer<typeof schema>
const viRoles: Record<string, string> = { OWNER: 'Chủ cơ sở', MANAGER: 'Quản lý', RECEPTIONIST: 'Lễ tân', TECHNICIAN: 'Kỹ thuật viên' }
const roles = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'TECHNICIAN'] as const
const statuses = ['ACTIVE', 'INACTIVE'] as const

export function StaffManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')

  const staffQuery = useQuery({ queryKey: ['staff-management', branchId], queryFn: () => getStaff(branchId!), enabled: Boolean(branchId) })

  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', role: 'TECHNICIAN', status: 'ACTIVE' } })
  const updateForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', role: 'TECHNICIAN', status: 'ACTIVE' } })
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['staff-management', branchId] })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createStaff({ branchId: branchId!, ...values }),
    onSuccess: async (staff) => { await refresh(); setSelectedStaffId(staff.id); createForm.reset({ name: '', role: 'TECHNICIAN', status: 'ACTIVE' }); updateForm.reset({ name: staff.name, role: staff.role, status: staff.status }) },
  })

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => updateStaff(selectedStaffId, { branchId: branchId!, ...values }),
    onSuccess: async (staff) => { await refresh(); updateForm.reset({ name: staff.name, role: staff.role, status: staff.status }) },
  })

  const selectedStaff = staffQuery.data?.find((item) => item.id === selectedStaffId)

  return (
    <div className="space-y-8">
      <PageCard title="Quản lý nhân viên">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {staffQuery.data?.map((staff) => (
              <button key={staff.id} type="button" onClick={() => { setSelectedStaffId(staff.id); updateForm.reset({ name: staff.name, role: staff.role, status: staff.status }) }}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedStaffId === staff.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{staff.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{viRoles[staff.role] ?? staff.role}</p>
                  </div>
                  <StatusBadge value={staff.status} />
                </div>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-slate-900">Nhân viên đang chọn</p>
            {selectedStaff ? <p className="mt-2 text-slate-600">{selectedStaff.name} · {viRoles[selectedStaff.role] ?? selectedStaff.role}</p> : <p className="mt-2 text-slate-500">Chọn nhân viên từ danh sách để chỉnh sửa.</p>}
          </div>
        </div>
      </PageCard>

      <PageCard title="Thao tác nhân viên">
        <Tabs tabs={[
          {
            key: 'create',
            label: 'Thêm mới',
            content: (
              <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tên nhân viên</label>
                  <input {...createForm.register('name')} placeholder="Nhập tên" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Vai trò</label>
                  <select {...createForm.register('role')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
                    {roles.map((role) => <option key={role} value={role}>{viRoles[role]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
                  <select {...createForm.register('status')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
                    {statuses.map((status) => <option key={status} value={status}>{status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}</option>)}
                  </select>
                </div>
                {createMutation.isError ? <ErrorAlert message="Thêm nhân viên thất bại." /> : null}
                <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">
                  {createMutation.isPending ? 'Đang tạo...' : 'Thêm nhân viên'}
                </button>
              </form>
            ),
          },
          {
            key: 'update',
            label: 'Chỉnh sửa',
            disabled: !selectedStaffId,
            content: (
              <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tên nhân viên</label>
                  <input {...updateForm.register('name')} placeholder="Nhập tên" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Vai trò</label>
                  <select {...updateForm.register('role')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
                    {roles.map((role) => <option key={role} value={role}>{viRoles[role]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
                  <select {...updateForm.register('status')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600">
                    {statuses.map((status) => <option key={status} value={status}>{status === 'ACTIVE' ? 'Hoạt động' : 'Ngưng hoạt động'}</option>)}
                  </select>
                </div>
                {updateMutation.isError ? <ErrorAlert message="Cập nhật nhân viên thất bại." /> : null}
                {updateMutation.isSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cập nhật thành công!</div> : null}
                <button type="submit" disabled={updateMutation.isPending || !selectedStaffId} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            ),
          },
        ]} />
      </PageCard>
    </div>
  )
}
