import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <DashboardContent />

        {/* Footer */}
        <footer className="border-t border-border px-4 py-4 lg:px-6">
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <p>Copyright 2024 Peterdraw</p>
            <div className="flex gap-4 lg:gap-6">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Term and conditions</a>
              <a href="#" className="hover:text-foreground">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
