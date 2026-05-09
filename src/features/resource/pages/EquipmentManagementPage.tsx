import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createEquipment, getEquipment, updateEquipment } from '@/features/resource/services/equipment.api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.string().min(1, 'Quantity is required').refine((value) => Number(value) >= 0, 'Quantity must be non-negative'),
})

type FormValues = z.infer<typeof schema>

export function EquipmentManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')

  const equipmentQuery = useQuery({ queryKey: ['equipment-management', branchId], queryFn: () => getEquipment(branchId!), enabled: Boolean(branchId) })
  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', quantity: '0' } })
  const updateForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', quantity: '0' } })
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['equipment-management', branchId] })

  const createMutation = useMutation({ mutationFn: (values: FormValues) => createEquipment({ branchId: branchId!, name: values.name, quantity: Number(values.quantity) }), onSuccess: async (equipment) => { await refresh(); setSelectedEquipmentId(equipment.id); createForm.reset({ name: '', quantity: '0' }); updateForm.reset({ name: equipment.name, quantity: String(equipment.quantity) }) } })
  const updateMutation = useMutation({ mutationFn: (values: FormValues) => updateEquipment(selectedEquipmentId, { branchId: branchId!, name: values.name, quantity: Number(values.quantity) }), onSuccess: async (equipment) => { await refresh(); updateForm.reset({ name: equipment.name, quantity: String(equipment.quantity) }) } })
  const selectedEquipment = equipmentQuery.data?.find((item) => item.id === selectedEquipmentId)

  return (
    <div className="space-y-6">
      <PageCard title="Equipment management" description="Create and update equipment resources for the active branch.">
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span>.</div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {equipmentQuery.data?.map((equipment) => (
              <button key={equipment.id} type="button" onClick={() => { setSelectedEquipmentId(equipment.id); updateForm.reset({ name: equipment.name, quantity: String(equipment.quantity) }) }} className={`w-full rounded-2xl border p-5 text-left transition ${selectedEquipmentId === equipment.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                <h3 className="text-lg font-semibold text-white">{equipment.name}</h3>
                <p className="mt-2 text-sm text-slate-300">Quantity: <span className="text-white">{equipment.quantity}</span></p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300"><p className="font-medium text-white">Selected equipment</p>{selectedEquipment ? <p className="mt-2">{selectedEquipment.name} · qty {selectedEquipment.quantity}</p> : <p className="mt-2 text-slate-400">Select equipment to edit.</p>}</div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageCard title="Create equipment" description="Add a new equipment resource.">
          <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <input {...createForm.register('name')} placeholder="Equipment name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" {...createForm.register('quantity')} placeholder="Quantity" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            {createMutation.isError ? <p className="text-sm text-rose-400">Failed to create equipment.</p> : null}
            <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">{createMutation.isPending ? 'Creating...' : 'Create equipment'}</button>
          </form>
        </PageCard>
        <PageCard title="Update equipment" description="Update the selected equipment resource.">
          <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
            <input {...updateForm.register('name')} placeholder="Equipment name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" {...updateForm.register('quantity')} placeholder="Quantity" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            {updateMutation.isError ? <p className="text-sm text-rose-400">Failed to update equipment.</p> : null}
            {updateMutation.isSuccess ? <p className="text-sm text-emerald-300">Equipment updated successfully.</p> : null}
            <button type="submit" disabled={updateMutation.isPending || !selectedEquipmentId} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 hover:bg-emerald-300 disabled:opacity-60">{updateMutation.isPending ? 'Saving...' : 'Save equipment changes'}</button>
          </form>
        </PageCard>
      </div>
    </div>
  )
}
