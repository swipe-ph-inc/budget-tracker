export default function SavingPlansLoading() {
  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-screen-2xl space-y-6">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-xl bg-muted lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </main>
    </>
  )
}

