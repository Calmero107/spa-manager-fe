import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { deleteStaffSkill, getStaffSkills, upsertStaffSkill } from '@/features/resource/services/staff-skill.api'
import { getStaff } from '@/features/staff/services/staff.api'

const viRoles: Record<string, string> = { OWNER: 'Chủ cơ sở', MANAGER: 'Quản lý', RECEPTIONIST: 'Lễ tân', TECHNICIAN: 'Kỹ thuật viên' }

const schema = z.object({
  skillCode: z.string().min(1, 'Vui lòng nhập mã kỹ năng'),
  level: z.string().min(1, 'Vui lòng nhập cấp độ').refine((v) => Number(v) > 0, 'Cấp độ phải lớn hơn 0'),
})
type FormValues = z.infer<typeof schema>

export function StaffSkillManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const staffQuery = useQuery({ queryKey: ['staff-skill-staff', branchId], queryFn: () => getStaff(branchId!), enabled: Boolean(branchId) })
  const skillsQuery = useQuery({ queryKey: ['staff-skills', selectedStaffId], queryFn: () => getStaffSkills(selectedStaffId), enabled: Boolean(selectedStaffId) })
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { skillCode: '', level: '1' } })
  const refreshSkills = async () => queryClient.invalidateQueries({ queryKey: ['staff-skills', selectedStaffId] })

  const upsertMutation = useMutation({
    mutationFn: (values: FormValues) => upsertStaffSkill(selectedStaffId, { branchId: branchId!, skillCode: values.skillCode, level: Number(values.level) }),
    onSuccess: async () => { await refreshSkills(); form.reset({ skillCode: '', level: '1' }) },
  })
  const deleteMutation = useMutation({ mutationFn: (skillCode: string) => deleteStaffSkill(selectedStaffId, branchId!, skillCode), onSuccess: refreshSkills })

  const selectedStaff = staffQuery.data?.find((item) => item.id === selectedStaffId)

  return (
    <div className="space-y-8">
      <PageCard title="Kỹ năng nhân viên">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {staffQuery.data?.map((staff) => (
              <button key={staff.id} type="button" onClick={() => setSelectedStaffId(staff.id)}
                className={`w-full rounded-2xl border p-5 text-left transition ${selectedStaffId === staff.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <h3 className="text-base font-semibold text-slate-900">{staff.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{viRoles[staff.role] ?? staff.role}</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <p className="font-semibold text-slate-900">Nhân viên đang chọn</p>
            {selectedStaff ? <p className="mt-2 text-slate-600">{selectedStaff.name}</p> : <p className="mt-2 text-slate-500">Chọn nhân viên để quản lý kỹ năng.</p>}
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PageCard title="Gán kỹ năng">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Mã kỹ năng</label><input {...form.register('skillCode')} placeholder="Ví dụ: facial_basic" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Cấp độ</label><input type="number" {...form.register('level')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" /></div>
            {upsertMutation.isError ? <ErrorAlert message="Gán kỹ năng thất bại." /> : null}
            <button type="submit" disabled={upsertMutation.isPending || !selectedStaffId || !branchId} className="w-full rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">{upsertMutation.isPending ? 'Đang lưu...' : 'Lưu kỹ năng'}</button>
          </form>
        </PageCard>

        <PageCard title="Kỹ năng đã gán">
          {!selectedStaffId ? <EmptyState message="Chọn nhân viên để xem kỹ năng." /> : null}
          {skillsQuery.data?.length === 0 ? <EmptyState message="Chưa có kỹ năng nào được gán." /> : null}
          <div className="space-y-3">
            {skillsQuery.data?.map((skill) => (
              <div key={`${skill.staffId}-${skill.skillCode}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="font-medium text-slate-900">{skill.skillCode}</p>
                  <p className="text-sm text-slate-500">Cấp độ {skill.level}</p>
                </div>
                <button type="button" onClick={() => deleteMutation.mutate(skill.skillCode)} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50">Xóa</button>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  )
}
