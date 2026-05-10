import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { deleteStaffSkill, getStaffSkills, upsertStaffSkill } from '@/features/resource/services/staff-skill.api'
import { getStaff } from '@/features/staff/services/staff.api'

const schema = z.object({
  skillCode: z.string().min(1, 'Skill code is required'),
  level: z.string().min(1, 'Level is required').refine((value) => Number(value) > 0, 'Level must be positive'),
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

  const deleteMutation = useMutation({
    mutationFn: (skillCode: string) => deleteStaffSkill(selectedStaffId, branchId!, skillCode),
    onSuccess: refreshSkills,
  })

  const selectedStaff = staffQuery.data?.find((item) => item.id === selectedStaffId)

  return (
    <div className="space-y-6">
      <PageCard title="Staff skill management" description="Assign staff skill codes and proficiency levels for scheduling/resource matching.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            {staffQuery.data?.map((staff) => (
              <button key={staff.id} type="button" onClick={() => setSelectedStaffId(staff.id)} className={`w-full rounded-2xl border p-5 text-left transition ${selectedStaffId === staff.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                <h3 className="text-lg font-semibold text-white">{staff.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{staff.role}</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Selected staff</p>
            {selectedStaff ? <p className="mt-2">{selectedStaff.name}</p> : <p className="mt-2 text-slate-400">Select a staff member to manage skills.</p>}
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PageCard title="Assign skill" description="Add or update one skill code for the selected staff member.">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
            <input {...form.register('skillCode')} placeholder="Skill code (e.g. facial_basic)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" {...form.register('level')} placeholder="Skill level" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            {upsertMutation.isError ? <p className="text-sm text-rose-400">Failed to upsert staff skill.</p> : null}
            <button type="submit" disabled={upsertMutation.isPending || !selectedStaffId || !branchId} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">{upsertMutation.isPending ? 'Saving...' : 'Save staff skill'}</button>
          </form>
        </PageCard>

        <PageCard title="Assigned skills" description="Current skill codes linked to the selected staff member.">
          {!selectedStaffId ? <p className="text-slate-400">Select a staff member first.</p> : null}
          {skillsQuery.data?.length === 0 ? <p className="text-slate-400">No skills assigned yet.</p> : null}
          <div className="space-y-3">
            {skillsQuery.data?.map((skill) => (
              <div key={`${skill.staffId}-${skill.skillCode}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div>
                  <p className="text-white">{skill.skillCode}</p>
                  <p className="text-sm text-slate-400">Level {skill.level}</p>
                </div>
                <button type="button" onClick={() => deleteMutation.mutate(skill.skillCode)} className="rounded-xl border border-rose-700 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/30">Remove</button>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  )
}
