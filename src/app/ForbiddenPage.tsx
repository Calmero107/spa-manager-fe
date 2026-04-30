export function ForbiddenPage({ message }: { message?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center rounded-2xl border border-amber-800 bg-amber-950/20 p-8 text-center">
      <div className="max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Forbidden</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">You do not have access to this page</h1>
        <p className="mt-3 text-sm text-amber-100/80">
          {message ?? 'Your current role does not have permission to access this area.'}
        </p>
      </div>
    </div>
  )
}
