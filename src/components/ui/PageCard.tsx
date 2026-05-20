export function PageCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}
