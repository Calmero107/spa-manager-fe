import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageCard } from '@/components/ui/PageCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getOperationalDashboard } from '@/features/dashboard/services/dashboard.api'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const { user } = useAuth()
  const branchId = user?.branchId
  const [date, setDate] = useState(todayInput())

  const dashboardQuery = useQuery({
    queryKey: ['operational-dashboard', branchId, date],
    queryFn: () => getOperationalDashboard(branchId!, date),
    enabled: Boolean(branchId && date),
  })

  const data = dashboardQuery.data

  return (
    <div className="space-y-8">
      <PageCard title="Dashboard">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-700 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">Tổng quan hoạt động</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Hoạt động chi nhánh trong ngày</h2>
            <p className="mt-3 max-w-2xl text-sm text-cyan-100">
              Theo dõi nhanh tình hình lịch hẹn, buổi dịch vụ và liệu trình để vận hành hiệu quả.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/scheduling/board" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50">Bảng lịch hẹn</Link>
              <Link to="/appointments/lifecycle" className="rounded-xl border border-cyan-300 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600">Quản lý lịch hẹn</Link>
              <Link to="/treatment-plans" className="rounded-xl border border-cyan-300 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600">Liệu trình</Link>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Chọn ngày</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600" />
          </div>
        </div>

        {dashboardQuery.isLoading ? <LoadingSpinner message="Đang tải dữ liệu dashboard..." /> : null}
        {dashboardQuery.isError ? <ErrorAlert message="Không thể tải dữ liệu dashboard." onRetry={() => dashboardQuery.refetch()} /> : null}
      </PageCard>

      {data ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <PageCard title="Lịch hẹn hôm nay">
              <p className="mb-4 text-sm font-medium text-slate-500">Tổng: {data.appointmentsToday.total} lịch hẹn</p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-600">Chờ xử lý</span> <span className="font-medium text-slate-900">{data.appointmentsToday.pending}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Đã xác nhận</span> <span className="font-medium text-slate-900">{data.appointmentsToday.confirmed}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Đã check-in</span> <span className="font-medium text-slate-900">{data.appointmentsToday.checkedIn}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Hoàn thành</span> <span className="font-medium text-slate-900">{data.appointmentsToday.completed}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Đã hủy</span> <span className="font-medium text-slate-900">{data.appointmentsToday.cancelled}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Vắng mặt</span> <span className="font-medium text-slate-900">{data.appointmentsToday.noShow}</span></p>
              </div>
            </PageCard>

            <PageCard title="Buổi dịch vụ">
              <p className="mb-4 text-sm font-medium text-slate-500">Tổng: {data.sessions.total} buổi</p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-600">Chưa đặt lịch</span> <span className="font-medium text-slate-900">{data.sessions.notScheduled}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Đã đặt lịch</span> <span className="font-medium text-slate-900">{data.sessions.scheduled}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Đang thực hiện</span> <span className="font-medium text-slate-900">{data.sessions.inProgress}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Hoàn thành</span> <span className="font-medium text-slate-900">{data.sessions.completed}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Bỏ qua</span> <span className="font-medium text-slate-900">{data.sessions.skipped}</span></p>
              </div>
            </PageCard>

            <PageCard title="Liệu trình">
              <p className="mb-4 text-sm font-medium text-slate-500">Tổng: {data.treatmentPlans.total} liệu trình</p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-600">Bản nháp</span> <span className="font-medium text-slate-900">{data.treatmentPlans.draft}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Hoạt động</span> <span className="font-medium text-slate-900">{data.treatmentPlans.active}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Tạm dừng</span> <span className="font-medium text-slate-900">{data.treatmentPlans.paused}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Hoàn thành</span> <span className="font-medium text-slate-900">{data.treatmentPlans.completed}</span></p>
                <p className="flex justify-between"><span className="text-slate-600">Đã hủy</span> <span className="font-medium text-slate-900">{data.treatmentPlans.cancelled}</span></p>
              </div>
            </PageCard>

            <PageCard title="Trọng tâm hoạt động">
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                  <p className="font-medium text-cyan-800">Hành động tiếp theo</p>
                  <p className="mt-1 text-cyan-700">Mở Bảng lịch hẹn để xem lịch hẹn trong ngày.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-700">Hành động thay thế</p>
                  <p className="mt-1 text-slate-600">Mở trang Liệu trình để quản lý kế hoạch điều trị.</p>
                </div>
              </div>
            </PageCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PageCard title="Lịch hẹn sắp tới">
              <div className="space-y-4">
                {data.upcomingAppointments.length === 0 ? <EmptyState message="Không có lịch hẹn nào sắp tới." /> : null}
                {data.upcomingAppointments.map((item) => (
                  <div key={item.appointmentId} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">{new Date(item.startTime).toLocaleTimeString()} → {new Date(item.endTime).toLocaleTimeString()}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.customerName || 'Khách hàng'}</h3>
                        <p className="mt-1 text-sm text-slate-600">{item.staffName} · {item.roomName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={item.appointmentStatus} />
                        <StatusBadge value={item.sessionStatus} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to="/scheduling/board" className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">Xem bảng lịch</Link>
                      <Link to={`/appointments/lifecycle?appointmentId=${item.appointmentId}&sessionId=${item.sessionId}`} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700">Quản lý lịch hẹn</Link>
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>

            <PageCard title="Buổi chưa đặt lịch">
              <div className="space-y-4">
                {data.unscheduledSessions.length === 0 ? <EmptyState message="Tất cả buổi đều đã được đặt lịch." /> : null}
                {data.unscheduledSessions.map((item) => (
                  <div key={item.sessionId} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">Buổi #{item.sequenceNo}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.serviceName}</h3>
                        <p className="mt-1 text-sm text-slate-600">{item.customerName || 'Khách hàng'}</p>
                      </div>
                      <StatusBadge value={item.sessionStatus} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to={`/scheduling?sessionId=${item.sessionId}`} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700">Đặt lịch</Link>
                      <Link to={`/treatment-plans/${item.planId}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">Xem liệu trình</Link>
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PageCard title="Khối lượng công việc nhân viên">
              <div className="space-y-3">
                {data.staffWorkload.length === 0 ? <EmptyState message="Chưa có dữ liệu công việc nhân viên." /> : null}
                {data.staffWorkload.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm text-slate-800">#{index + 1} · {item.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </PageCard>

            <PageCard title="Khối lượng công việc phòng">
              <div className="space-y-3">
                {data.roomWorkload.length === 0 ? <EmptyState message="Chưa có dữ liệu công việc phòng." /> : null}
                {data.roomWorkload.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm text-slate-800">#{index + 1} · {item.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </PageCard>
          </div>
        </>
      ) : null}
    </div>
  )
}
