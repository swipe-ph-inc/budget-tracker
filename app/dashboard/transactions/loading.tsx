export default function TransactionsLoading() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto min-w-0 max-w-7xl space-y-4">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-3 sm:p-4 lg:px-6 lg:py-4">
              <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-64 animate-pulse bg-muted" />
            <div className="border-t border-border px-3 py-3 sm:px-4 lg:px-6">
              <div className="h-5 w-56 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

