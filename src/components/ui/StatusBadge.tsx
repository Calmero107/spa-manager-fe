import { cn } from '@/lib/cn'

const tones: Record<string, string> = {
  CONFIRMED: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  CHECKED_IN: 'border-amber-200 bg-amber-50 text-amber-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  SCHEDULED: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  INACTIVE: 'border-slate-300 bg-slate-100 text-slate-600',
  PAUSED: 'border-amber-200 bg-amber-50 text-amber-700',
  DRAFT: 'border-slate-300 bg-white text-slate-800',
  NOT_SCHEDULED: 'border-slate-300 bg-white text-slate-800',
  SKIPPED: 'border-slate-300 bg-slate-100 text-slate-600',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  NO_SHOW: 'border-rose-200 bg-rose-50 text-rose-700',
}

const viLabels: Record<string, string> = {
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  SCHEDULED: 'Đã đặt lịch',
  IN_PROGRESS: 'Đang thực hiện',
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngưng hoạt động',
  PAUSED: 'Tạm dừng',
  DRAFT: 'Bản nháp',
  NOT_SCHEDULED: 'Chưa đặt lịch',
  SKIPPED: 'Bỏ qua',
  PENDING: 'Chờ xử lý',
  NO_SHOW: 'Vắng mặt',
  OWNER: 'Chủ cơ sở',
  MANAGER: 'Quản lý',
  RECEPTIONIST: 'Lễ tân',
  TECHNICIAN: 'Kỹ thuật viên',
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', tones[value] ?? 'border-slate-200 bg-slate-100 text-slate-700')}>
      {viLabels[value] ?? value}
    </span>
  )
}
