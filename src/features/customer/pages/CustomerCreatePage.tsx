import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createCustomer } from '@/features/customer/services/customer.api'

const schema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  name: z.string().min(1, 'Name is required'),
})

type FormValues = z.infer<typeof schema>

export function CustomerCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const branchId = user?.branchId
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: '',
      name: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createCustomer({ ...values, branchId: branchId! }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['customers', branchId] })
      navigate(`/customers/${data.id}`)
    },
  })

  return (
    <PageCard title="Create customer" description="Create a customer in the signed-in user's current branch.">
      <form className="grid gap-5 md:max-w-xl" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-sm text-slate-400">Branch context</p>
          <p className="mt-2 break-all text-sm text-white">{branchId}</p>
          <p className="mt-2 text-xs text-slate-500">Taken automatically from the signed-in user session.</p>
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

        {!branchId ? <p className="text-sm text-amber-300">Missing branch context from signed-in user.</p> : null}
        {mutation.isError ? <p className="text-sm text-rose-400">Failed to create customer.</p> : null}

        <button
          type="submit"
          disabled={mutation.isPending || !branchId}
          className="rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Creating...' : 'Create customer'}
        </button>
      </form>
    </PageCard>
  )
}
