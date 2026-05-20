import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { createCustomer } from '@/features/customer/services/customer.api'

const schema = z.object({
  phone: z.string().min(1, 'Vui lòng nhập số điện thoại'),
  name: z.string().min(1, 'Vui lòng nhập tên khách hàng'),
  note: z.string().optional(),
  warningFlag: z.boolean(),
  warningNote: z.string().optional(),
}).superRefine((values, context) => {
  if (values.warningFlag && !values.warningNote?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng nhập ghi chú cảnh báo',
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
    <PageCard title="Thêm khách hàng">
      <form className="grid gap-5 md:max-w-2xl" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
          <input {...register('phone')} placeholder="Nhập số điện thoại" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
          {errors.phone ? <p className="mt-2 text-sm text-rose-600">{errors.phone.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Tên khách hàng</label>
          <input {...register('name')} placeholder="Nhập tên" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
          {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Ghi chú nội bộ</label>
          <textarea {...register('note')} placeholder="Ghi chú về khách hàng..." className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <label className="flex items-center gap-3 text-sm font-medium text-amber-800">
            <input type="checkbox" {...register('warningFlag')} className="rounded" />
            Đánh dấu khách hàng có cảnh báo
          </label>
          {warningFlag ? (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Ghi chú cảnh báo</label>
              <textarea {...register('warningNote')} placeholder="Lý do cảnh báo..." className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
              {errors.warningNote ? <p className="mt-2 text-sm text-rose-600">{errors.warningNote.message}</p> : null}
            </div>
          ) : null}
        </div>

        {mutation.isError ? <ErrorAlert message="Tạo khách hàng thất bại. Vui lòng thử lại." /> : null}

        <button
          type="submit"
          disabled={mutation.isPending || !branchId}
          className="rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Đang tạo...' : 'Thêm khách hàng'}
        </button>
      </form>
    </PageCard>
  )
}
