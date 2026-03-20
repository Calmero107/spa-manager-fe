import { PageCard } from '@/components/ui/PageCard'

const currentFeatures = [
  'Auth login + current user',
  'Customer list / get / create',
  'Scheduling query slot / lock slot / schedule session',
  'Appointment cancel / reschedule',
  'Appointment check-in',
  'Session complete',
  'Audit log + idempotency foundation in backend',
]

export function DashboardPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <PageCard title="Frontend base ready" description="This shell is designed to map exactly to the backend capabilities implemented so far.">
        <ul className="space-y-3 text-sm text-slate-300">
          {currentFeatures.map((feature) => (
            <li key={feature} className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
              {feature}
            </li>
          ))}
        </ul>
      </PageCard>

      <PageCard title="Recommended next FE slices" description="Practical sequence for mapping BE features into usable UI.">
        <ol className="space-y-3 text-sm text-slate-300">
          <li>1. Auth flow polish + route guards</li>
          <li>2. Customer management screen set</li>
          <li>3. Scheduling query / lock / schedule flow</li>
          <li>4. Appointment lifecycle screen: cancel / reschedule / check-in</li>
          <li>5. Complete session result screen</li>
        </ol>
      </PageCard>
    </div>
  )
}
