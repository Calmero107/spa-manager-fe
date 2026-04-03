import { cn } from '@/lib/cn'

const tones: Record<string, string> = {
  CONFIRMED: 'border-cyan-700 bg-cyan-950/40 text-cyan-200',
  CHECKED_IN: 'border-amber-700 bg-amber-950/40 text-amber-200',
  COMPLETED: 'border-emerald-700 bg-emerald-950/40 text-emerald-200',
  CANCELLED: 'border-rose-700 bg-rose-950/40 text-rose-200',
  SCHEDULED: 'border-cyan-700 bg-cyan-950/40 text-cyan-200',
  IN_PROGRESS: 'border-amber-700 bg-amber-950/40 text-amber-200',
  ACTIVE: 'border-emerald-700 bg-emerald-950/40 text-emerald-200',
  PAUSED: 'border-amber-700 bg-amber-950/40 text-amber-200',
  DRAFT: 'border-slate-700 bg-slate-900/70 text-slate-200',
  NOT_SCHEDULED: 'border-slate-700 bg-slate-900/70 text-slate-200',
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', tones[value] ?? 'border-slate-700 bg-slate-900/70 text-slate-200')}>
      {value}
    </span>
  )
}
