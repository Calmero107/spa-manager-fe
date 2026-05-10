import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { deleteServiceRequirement, getServiceRequirements, upsertServiceRequirement } from '@/features/resource/services/service-requirement.api'
import { getServices } from '@/features/service/services/service.api'

const schema = z.object({
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceCode: z.string().min(1, 'Resource code is required'),
  quantity: z.string().min(1, 'Quantity is required').refine((value) => Number(value) > 0, 'Quantity must be positive'),
})

type FormValues = z.infer<typeof schema>
const resourceTypes = ['STAFF', 'EQUIPMENT'] as const

export function ServiceRequirementManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedServiceId, setSelectedServiceId] = useState('')

  const servicesQuery = useQuery({ queryKey: ['service-requirement-services', branchId], queryFn: () => getServices(branchId!), enabled: Boolean(branchId) })
  const requirementsQuery = useQuery({ queryKey: ['service-requirements', selectedServiceId], queryFn: () => getServiceRequirements(selectedServiceId), enabled: Boolean(selectedServiceId) })
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { resourceType: 'STAFF', resourceCode: '', quantity: '1' } })

  const refreshRequirements = async () => queryClient.invalidateQueries({ queryKey: ['service-requirements', selectedServiceId] })

  const upsertMutation = useMutation({
    mutationFn: (values: FormValues) => upsertServiceRequirement(selectedServiceId, { branchId: branchId!, resourceType: values.resourceType, resourceCode: values.resourceCode, quantity: Number(values.quantity) }),
    onSuccess: async () => { await refreshRequirements(); form.reset({ resourceType: 'STAFF', resourceCode: '', quantity: '1' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ resourceType, resourceCode }: { resourceType: string; resourceCode: string }) => deleteServiceRequirement(selectedServiceId, branchId!, resourceType, resourceCode),
    onSuccess: refreshRequirements,
  })

  const selectedService = servicesQuery.data?.find((item) => item.id === selectedServiceId)

  return (
    <div className="space-y-6">
      <PageCard title="Service resource requirements" description="Assign required staff skill codes or equipment resources to each service.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            {servicesQuery.data?.map((service) => (
              <button key={service.id} type="button" onClick={() => setSelectedServiceId(service.id)} className={`w-full rounded-2xl border p-5 text-left transition ${selectedServiceId === service.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{service.duration} mins · {service.price}</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Selected service</p>
            {selectedService ? <p className="mt-2">{selectedService.name}</p> : <p className="mt-2 text-slate-400">Select a service to manage requirements.</p>}
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PageCard title="Assign requirement" description="Add or update one requirement record for the selected service.">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
            <select {...form.register('resourceType')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">{resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <input {...form.register('resourceCode')} placeholder="Resource code (e.g. facial_basic or machine-a)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" {...form.register('quantity')} placeholder="Quantity" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            {upsertMutation.isError ? <p className="text-sm text-rose-400">Failed to upsert service requirement.</p> : null}
            <button type="submit" disabled={upsertMutation.isPending || !selectedServiceId || !branchId} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">{upsertMutation.isPending ? 'Saving...' : 'Save service requirement'}</button>
          </form>
        </PageCard>

        <PageCard title="Assigned requirements" description="Current scheduling/resource requirements linked to the selected service.">
          {!selectedServiceId ? <p className="text-slate-400">Select a service first.</p> : null}
          {requirementsQuery.data?.length === 0 ? <p className="text-slate-400">No requirements assigned yet.</p> : null}
          <div className="space-y-3">
            {requirementsQuery.data?.map((requirement) => (
              <div key={`${requirement.serviceId}-${requirement.resourceType}-${requirement.resourceCode}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div>
                  <p className="text-white">{requirement.resourceCode}</p>
                  <p className="text-sm text-slate-400">{requirement.resourceType} · qty {requirement.quantity}</p>
                </div>
                <button type="button" onClick={() => deleteMutation.mutate({ resourceType: requirement.resourceType, resourceCode: requirement.resourceCode })} className="rounded-xl border border-rose-700 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/30">Remove</button>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  )
}
