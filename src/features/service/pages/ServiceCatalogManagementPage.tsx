import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createService, getServices, updateService } from '@/features/service/services/service.api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration: z.string().min(1, 'Duration is required').refine((value) => Number(value) > 0, 'Duration must be positive'),
  price: z.string().min(1, 'Price is required').refine((value) => Number(value) >= 0, 'Price must be non-negative'),
})

type FormValues = z.infer<typeof schema>

export function ServiceCatalogManagementPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const queryClient = useQueryClient()
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')

  const servicesQuery = useQuery({
    queryKey: ['service-management', branchId],
    queryFn: () => getServices(branchId!),
    enabled: Boolean(branchId),
  })

  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', duration: '60', price: '0' } })
  const updateForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', duration: '60', price: '0' } })

  const refresh = async () => queryClient.invalidateQueries({ queryKey: ['service-management', branchId] })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createService({ branchId: branchId!, name: values.name, duration: Number(values.duration), price: Number(values.price) }),
    onSuccess: async (service) => {
      await refresh()
      setSelectedServiceId(service.id)
      createForm.reset({ name: '', duration: '60', price: '0' })
      updateForm.reset({ name: service.name, duration: String(service.duration), price: String(service.price) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => updateService(selectedServiceId, { branchId: branchId!, name: values.name, duration: Number(values.duration), price: Number(values.price) }),
    onSuccess: async (service) => {
      await refresh()
      updateForm.reset({ name: service.name, duration: String(service.duration), price: String(service.price) })
    },
  })

  const selectedService = servicesQuery.data?.find((item) => item.id === selectedServiceId)

  return (
    <div className="space-y-6">
      <PageCard title="Service catalog" description="Create and update treatment services in the active branch.">
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          Using <span className="font-mono text-slate-200">branchId={branchId ?? 'missing'}</span>.
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {servicesQuery.data?.map((service) => (
              <button key={service.id} type="button" onClick={() => { setSelectedServiceId(service.id); updateForm.reset({ name: service.name, duration: String(service.duration), price: String(service.price) }) }} className={`w-full rounded-2xl border p-5 text-left transition ${selectedServiceId === service.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                <p className="mt-2 text-sm text-slate-300">Duration: <span className="text-white">{service.duration} mins</span></p>
                <p className="mt-1 text-sm text-slate-300">Price: <span className="text-white">{service.price}</span></p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Selected service</p>
            {selectedService ? <p className="mt-2">{selectedService.name} · {selectedService.duration} mins</p> : <p className="mt-2 text-slate-400">Select a service to edit.</p>}
          </div>
        </div>
      </PageCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageCard title="Create service" description="Add a new service offering.">
          <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <input {...createForm.register('name')} placeholder="Service name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" {...createForm.register('duration')} placeholder="Duration (minutes)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" step="0.01" {...createForm.register('price')} placeholder="Price" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            {createMutation.isError ? <p className="text-sm text-rose-400">Failed to create service.</p> : null}
            <button type="submit" disabled={createMutation.isPending || !branchId} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
              {createMutation.isPending ? 'Creating...' : 'Create service'}
            </button>
          </form>
        </PageCard>

        <PageCard title="Update service" description="Update the selected service offering.">
          <form className="space-y-4" onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))}>
            <input {...updateForm.register('name')} placeholder="Service name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" {...updateForm.register('duration')} placeholder="Duration (minutes)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="number" step="0.01" {...updateForm.register('price')} placeholder="Price" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
            {updateMutation.isError ? <p className="text-sm text-rose-400">Failed to update service.</p> : null}
            {updateMutation.isSuccess ? <p className="text-sm text-emerald-300">Service updated successfully.</p> : null}
            <button type="submit" disabled={updateMutation.isPending || !selectedServiceId} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
              {updateMutation.isPending ? 'Saving...' : 'Save service changes'}
            </button>
          </form>
        </PageCard>
      </div>
    </div>
  )
}
