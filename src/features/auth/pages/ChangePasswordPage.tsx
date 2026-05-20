import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { changeMyPassword } from '@/features/auth/services/account.api'

const schema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
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
    <PageCard title="Đổi mật khẩu">
      <form className="grid gap-5 md:max-w-xl" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
          <input
            type="password"
            {...form.register('currentPassword')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
          />
          {form.formState.errors.currentPassword ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.currentPassword.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
          <input
            type="password"
            {...form.register('newPassword')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
          />
          {form.formState.errors.newPassword ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.newPassword.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            {...form.register('confirmPassword')}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
          />
          {form.formState.errors.confirmPassword ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.confirmPassword.message}</p> : null}
        </div>

        {mutation.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Đổi mật khẩu thất bại. Vui lòng thử lại.</div>
        ) : null}
        {mutation.isSuccess ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Đổi mật khẩu thành công!</div>
        ) : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </PageCard>
  )
}
