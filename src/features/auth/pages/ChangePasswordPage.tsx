import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { changeMyPassword } from '@/features/auth/services/account.api'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm the new password'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: 'Password confirmation does not match',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export function ChangePasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => changeMyPassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }),
    onSuccess: () => {
      form.reset()
    },
  })

  return (
    <PageCard title="Change password" description="Update the password for the currently signed-in account.">
      <form className="grid gap-5 md:max-w-xl" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Current password</label>
          <input
            type="password"
            {...form.register('currentPassword')}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          />
          {form.formState.errors.currentPassword ? <p className="mt-2 text-sm text-rose-400">{form.formState.errors.currentPassword.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">New password</label>
          <input
            type="password"
            {...form.register('newPassword')}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          />
          {form.formState.errors.newPassword ? <p className="mt-2 text-sm text-rose-400">{form.formState.errors.newPassword.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Confirm new password</label>
          <input
            type="password"
            {...form.register('confirmPassword')}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          />
          {form.formState.errors.confirmPassword ? <p className="mt-2 text-sm text-rose-400">{form.formState.errors.confirmPassword.message}</p> : null}
        </div>

        {mutation.isError ? <p className="text-sm text-rose-400">Failed to change password.</p> : null}
        {mutation.isSuccess ? <p className="text-sm text-emerald-300">Password changed successfully.</p> : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </PageCard>
  )
}
