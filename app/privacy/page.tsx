import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Budget Partner Privacy Policy – how we collect, use, and protect your personal information.",
  robots: { index: false, follow: false },
}

const LAST_UPDATED = "March 12, 2026"
const CONTACT_EMAIL = "privacy@budgetpartner.com"

export default function PrivacyPolicyPage() {
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

        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-muted-foreground [&_ul]:text-muted-foreground">

          <p>
            Welcome to Budget Partner (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our financial management platform (the &quot;Service&quot;).
          </p>
          <p>
            By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect the following categories of information:</p>
          <ul>
            <li><strong>Account information:</strong> name, email address, phone number, and password (stored as a hash).</li>
            <li><strong>Financial data:</strong> accounts, transactions, payment records, savings plans, and budgets you create within the Service.</li>
            <li><strong>Usage data:</strong> pages visited, features used, IP address, browser type, and device information collected automatically via logs and cookies.</li>
            <li><strong>Payment information:</strong> subscription billing is processed by Stripe. We do not store your full card details.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service.</li>
            <li>Process transactions and send related notifications.</li>
            <li>Respond to your support requests.</li>
            <li>Send service-related communications (e.g., email verification, password reset).</li>
            <li>Comply with legal obligations.</li>
            <li>Detect and prevent fraud or abuse.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2>3. Cookies and Tracking</h2>
          <p>
            We use essential cookies to authenticate your session and remember your preferences (e.g., &quot;Remember Me&quot;). We do not use advertising cookies or cross-site tracking. You can manage cookie preferences in your browser settings; disabling essential cookies may prevent you from signing in.
          </p>

          <h2>4. Data Sharing</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Supabase</strong> – database and authentication provider.</li>
            <li><strong>Stripe</strong> – payment processing for subscriptions.</li>
            <li><strong>Vercel</strong> – hosting and content delivery.</li>
            <li><strong>Law enforcement</strong> – when required by applicable law or court order.</li>
          </ul>
          <p>All third-party providers are bound by data processing agreements consistent with this policy.</p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide the Service. You may request deletion of your account at any time by contacting us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
            We will delete your data within 30 days of a verified deletion request, subject to legal retention requirements.
          </p>

          <h2>6. Security</h2>
          <p>
            We implement industry-standard security measures including HTTPS encryption, bcrypt password hashing, row-level security on our database, and HTTP-only authentication cookies. No method of transmission or storage is 100% secure; we cannot guarantee absolute security.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Data portability.</li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to individuals under 18 years of age. We do not knowingly collect personal data from children. If you believe we have inadvertently collected such data, contact us immediately.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance of the updated policy.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Budget Partner. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-6">
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
