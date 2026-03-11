export default function InsightsLoading() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-screen-2xl space-y-6">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </>
  )
}
