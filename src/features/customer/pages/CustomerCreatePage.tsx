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
  note: z.string().optional(),
  warningFlag: z.boolean(),
  warningNote: z.string().optional(),
}).superRefine((values, context) => {
  if (values.warningFlag && !values.warningNote?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Warning note is required when warning flag is enabled',
      path: ['warningNote'],
    })
  }
})

type FormValues = z.infer<typeof schema>

export function CustomerCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const branchId = user?.branchId
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: '',
      name: '',
      note: '',
      warningFlag: false,
      warningNote: '',
    },
  })

  const warningFlag = watch('warningFlag')

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createCustomer({ ...values, branchId: branchId! }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['customers', branchId] })
      navigate(`/customers/${data.id}`)
    },
  })

  return (
    <PageCard title="Create customer" description="Create a customer in the signed-in user's current branch.">
      <form className="grid gap-5 md:max-w-2xl" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
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

        <div>
          <label className="mb-2 block text-sm text-slate-300">Internal note</label>
          <textarea {...register('note')} className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
        </div>

        <div className="rounded-xl border border-amber-800 bg-amber-950/20 p-4">
          <label className="flex items-center gap-3 text-sm text-amber-100">
            <input type="checkbox" {...register('warningFlag')} />
            Mark this customer with a warning flag
          </label>
          {warningFlag ? (
            <div className="mt-3">
              <label className="mb-2 block text-sm text-slate-300">Warning note</label>
              <textarea {...register('warningNote')} className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" />
              {errors.warningNote ? <p className="mt-2 text-sm text-rose-400">{errors.warningNote.message}</p> : null}
            </div>
          ) : null}
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
