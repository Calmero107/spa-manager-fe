import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { createCustomer } from '@/features/customer/services/customer.api'

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID ?? '11111111-1111-1111-1111-111111111111'

const schema = z.object({
  branchId: z.string().min(1),
  phone: z.string().min(1, 'Phone is required'),
  name: z.string().min(1, 'Name is required'),
})

type FormValues = z.infer<typeof schema>

export function CustomerCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      branchId: DEFAULT_BRANCH_ID,
      phone: '',
      name: '',
    },
  })

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['customers', DEFAULT_BRANCH_ID] })
      navigate(`/customers/${data.id}`)
    },
  })

  return (
    <PageCard title="Create customer" description="Mapped to POST /customers.">
      <form className="grid gap-5 md:max-w-xl" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Branch ID</label>
          <input {...register('branchId')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Phone</label>
          <input {...register('phone')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
          {errors.phone ? <p className="mt-2 text-sm text-rose-400">{errors.phone.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Name</label>
          <input {...register('name')} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
          {errors.name ? <p className="mt-2 text-sm text-rose-400">{errors.name.message}</p> : null}
        </div>

        {mutation.isError ? <p className="text-sm text-rose-400">Failed to create customer.</p> : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Creating...' : 'Create customer'}
        </button>
      </form>
    </PageCard>
  )
}
