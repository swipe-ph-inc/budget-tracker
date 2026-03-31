import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Budget Partner Refund Policy – our policy on refunds and cancellations.",
  robots: { index: false, follow: false },
}

const LAST_UPDATED = "March 30, 2026"
const CONTACT_EMAIL = "admin@budgetpartner.com"

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-muted-foreground [&_ul]:text-muted-foreground">

          <p>
            This Refund Policy describes the conditions under which Budget Partner (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) will issue refunds for paid subscriptions to the Budget Partner platform (the &quot;Service&quot;). By subscribing to the Service, you agree to the terms of this policy.
          </p>

          <h2>1. Free Trial</h2>
          <p>
            Budget Partner offers a 14-day free trial of the Pro plan. No credit card is required to start a trial. If you cancel your account before the trial period ends, you will not be charged. Once you choose to subscribe after the trial, standard subscription terms apply.
          </p>

          <h2>2. Monthly Subscriptions</h2>
          <p>
            Monthly subscription fees are billed in advance at the start of each billing cycle. We do not offer refunds for monthly fees once the billing cycle has started. You may cancel your subscription at any time from your account settings; you will retain access to Pro features until the end of your current billing period, after which your account will automatically revert to the Free plan.
          </p>

          <h2>3. Annual Subscriptions</h2>
          <p>
            If you purchase an annual subscription, you may request a full refund within 14 days of the initial payment date. After 14 days, no refunds will be issued for the remaining portion of the annual term. You may still cancel at any time; your access to Pro features will continue until the end of the paid annual period.
          </p>

          <h2>4. How to Request a Refund</h2>
          <p>
            To request a refund, please email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>{" "}
            with the following information:
          </p>
          <ul>
            <li>Your account email address</li>
            <li>The date of purchase</li>
            <li>The reason for your refund request</li>
          </ul>
          <p>
            We will review your request and respond within 3–5 business days. Approved refunds are processed through LemonSqueezy and may take 5–10 business days to appear on your statement depending on your payment method and financial institution.
          </p>

          <h2>5. Exceptions — No Refund Cases</h2>
          <p>Refunds will not be issued in the following circumstances:</p>
          <ul>
            <li>Accounts found to have abused the free trial or refund policy</li>
            <li>Accounts terminated for violations of our{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            </li>
            <li>Refund requests made outside the eligible 14-day window for annual subscriptions</li>
            <li>Partial-month refunds for monthly subscriptions</li>
          </ul>

          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance of the revised policy.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have questions about this Refund Policy, please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Budget Partner. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
