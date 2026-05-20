import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getCustomer, getCustomerAuditHistory, getCustomerHistory, updateCustomer } from '@/features/customer/services/customer.api'

const schema = z.object({
  phone: z.string().min(1, 'Vui lòng nhập số điện thoại'),
  name: z.string().min(1, 'Vui lòng nhập tên'),
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

export function CustomerDetailPage() {
  const { customerId = '' } = useParams()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', name: '', note: '', warningFlag: false, warningNote: '' },
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => getCustomer(customerId),
    enabled: Boolean(customerId),
  })

  const historyQuery = useQuery({
    queryKey: ['customer-history', customerId],
    queryFn: () => getCustomerHistory(customerId),
    enabled: Boolean(customerId),
  })

  const auditQuery = useQuery({
    queryKey: ['customer-audit-history', customerId],
    queryFn: () => getCustomerAuditHistory(customerId),
    enabled: Boolean(customerId),
  })

  const warningFlag = form.watch('warningFlag')

  useEffect(() => {
    if (!data) return
    form.reset({ phone: data.phone, name: data.name || '', note: data.note || '', warningFlag: data.warningFlag, warningNote: data.warningNote || '' })
  }, [data, form])

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => updateCustomer(customerId, { branchId: data!.branchId, ...values }),
    onSuccess: async (updatedCustomer) => {
      form.reset({ phone: updatedCustomer.phone, name: updatedCustomer.name || '', note: updatedCustomer.note || '', warningFlag: updatedCustomer.warningFlag, warningNote: updatedCustomer.warningNote || '' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer-detail', customerId] }),
        queryClient.invalidateQueries({ queryKey: ['customer-history', customerId] }),
        queryClient.invalidateQueries({ queryKey: ['customer-audit-history', customerId] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
      ])
    },
  })

  return (
    <div className="space-y-8">
      <PageCard title="Chi tiết khách hàng">
        {isLoading ? <LoadingSpinner message="Đang tải thông tin khách hàng..." /> : null}
        {isError ? <ErrorAlert message="Không thể tải thông tin khách hàng." onRetry={() => refetch()} /> : null}
        {data ? (
          <>
            {data.warningFlag ? (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm">
                <p className="font-semibold text-amber-800">⚠ Khách hàng có cảnh báo</p>
                <p className="mt-1 text-amber-700">{data.warningNote || 'Khách hàng này có cờ cảnh báo đang hoạt động.'}</p>
              </div>
            ) : null}

            <div className="mb-6 flex flex-wrap justify-end gap-3">
              <Link to={`/treatment-plans?customerId=${data.id}`} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                Xem liệu trình
              </Link>
              <Link to={`/treatment-plans/new?customerId=${data.id}`} className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">
                + Tạo liệu trình
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Ngày tạo</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{new Date(data.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Cập nhật lần cuối</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Trạng thái cảnh báo</p>
                <div className="mt-2">{data.warningFlag ? <StatusBadge value="PAUSED" /> : <StatusBadge value="ACTIVE" />}</div>
              </div>
            </div>

            <form className="mt-8 grid gap-5 md:max-w-2xl" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tên khách hàng</label>
                <input {...form.register('name')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                {form.formState.errors.name ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.name.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
                <input {...form.register('phone')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                {form.formState.errors.phone ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.phone.message}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Ghi chú nội bộ</label>
                <textarea {...form.register('note')} className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <label className="flex items-center gap-3 text-sm font-medium text-amber-800">
                  <input type="checkbox" {...form.register('warningFlag')} />
                  Đánh dấu khách hàng có cảnh báo
                </label>
                {warningFlag ? (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Ghi chú cảnh báo</label>
                    <textarea {...form.register('warningNote')} className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
                    {form.formState.errors.warningNote ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.warningNote.message}</p> : null}
                  </div>
                ) : null}
              </div>
              {updateMutation.isError ? <ErrorAlert message="Cập nhật khách hàng thất bại." /> : null}
              {updateMutation.isSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Cập nhật thành công!</div> : null}
              <button type="submit" disabled={updateMutation.isPending} className="rounded-xl bg-cyan-600 px-4 py-3.5 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </>
        ) : null}
      </PageCard>

      <PageCard title="Lịch sử khách hàng">
        {historyQuery.isLoading ? <LoadingSpinner message="Đang tải lịch sử..." /> : null}
        {historyQuery.isError ? <ErrorAlert message="Không thể tải lịch sử khách hàng." onRetry={() => historyQuery.refetch()} /> : null}
        {historyQuery.data ? (
          <div className="space-y-8">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Liệu trình</h3>
                <span className="text-sm text-slate-500">{historyQuery.data.treatmentPlans.length} mục</span>
              </div>
              {historyQuery.data.treatmentPlans.length === 0 ? <EmptyState message="Chưa có liệu trình nào." /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {historyQuery.data.treatmentPlans.map((plan) => (
                  <Link key={plan.planId} to={`/treatment-plans/${plan.planId}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Liệu trình</p>
                        <p className="mt-1 text-sm text-slate-600">Tổng giá: {plan.totalPrice}</p>
                      </div>
                      <StatusBadge value={plan.status} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Ngày tạo: {new Date(plan.createdAt).toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Các buổi</h3>
                <span className="text-sm text-slate-500">{historyQuery.data.sessions.length} mục</span>
              </div>
              {historyQuery.data.sessions.length === 0 ? <EmptyState message="Chưa có buổi dịch vụ nào." /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {historyQuery.data.sessions.map((session) => (
                  <div key={session.sessionId} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">Buổi #{session.sequenceNo}</p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">{session.serviceName}</h3>
                      </div>
                      <StatusBadge value={session.status} />
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>Thời lượng: <span className="text-slate-900">{session.duration} phút</span></p>
                      <p>Giá: <span className="text-slate-900">{session.price}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Lịch hẹn</h3>
                <span className="text-sm text-slate-500">{historyQuery.data.appointments.length} mục</span>
              </div>
              {historyQuery.data.appointments.length === 0 ? <EmptyState message="Chưa có lịch hẹn nào." /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {historyQuery.data.appointments.map((appointment) => (
                  <Link key={appointment.appointmentId} to={`/appointments/detail?appointmentId=${appointment.appointmentId}&sessionId=${appointment.sessionId}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Lịch hẹn</p>
                      </div>
                      <StatusBadge value={appointment.appointmentStatus} />
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>Kỹ thuật viên: <span className="text-slate-900">{appointment.staffName}</span></p>
                      <p>Phòng: <span className="text-slate-900">{appointment.roomName}</span></p>
                      <p>Thời gian: <span className="text-slate-900">{new Date(appointment.startTime).toLocaleString()} → {new Date(appointment.endTime).toLocaleString()}</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </PageCard>

      <PageCard title="Lịch sử thay đổi">
        {auditQuery.isLoading ? <LoadingSpinner message="Đang tải lịch sử thay đổi..." /> : null}
        {auditQuery.isError ? <ErrorAlert message="Không thể tải lịch sử thay đổi." onRetry={() => auditQuery.refetch()} /> : null}
        {auditQuery.data && auditQuery.data.length === 0 ? <EmptyState message="Chưa có lịch sử thay đổi nào." /> : null}
        <div className="space-y-4">
          {auditQuery.data?.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{entry.action}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  )
}
