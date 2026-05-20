import { Link } from 'react-router-dom'
import type { ScheduleSessionResponse } from '@/types/api'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function SchedulingResultCard({ result }: { result: ScheduleSessionResponse }) {
  return (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-emerald-800">Đặt lịch thành công!</p>
        <StatusBadge value={result.status} />
      </div>
      <div className="mt-3 space-y-1 text-emerald-700">
        <p>Bắt đầu: {new Date(result.startTime).toLocaleString()}</p>
        <p>Kết thúc: {new Date(result.endTime).toLocaleString()}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to={`/appointments/detail?appointmentId=${result.appointmentId}&sessionId=${result.sessionId}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
          Xem chi tiết lịch hẹn
        </Link>
        <Link to={`/appointments/lifecycle?appointmentId=${result.appointmentId}&sessionId=${result.sessionId}`} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700">
          Quản lý lịch hẹn
        </Link>
      </div>
    </div>
  )
}
