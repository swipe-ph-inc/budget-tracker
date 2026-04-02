"use client"

import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ManageMerchantsPanel } from "@/components/merchant/manage-merchants-panel"
import { ManageMerchantCategoriesPanel } from "@/components/merchant/manage-merchant-categories-panel"

export default function MerchantsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Merchants</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Merchants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage merchants and categories used across payments and invoices.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="min-h-0 overflow-y-auto rounded-xl border border-border bg-card p-4 lg:p-5">
            <ManageMerchantCategoriesPanel />
          </section>

          <section className="min-h-0 overflow-y-auto rounded-xl border border-border bg-card p-4 lg:p-5">
            <ManageMerchantsPanel />
          </section>
        </div>
      </div>
    </div>
  )
}

