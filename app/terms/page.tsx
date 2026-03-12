import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Budget Partner Terms of Service – the rules and conditions for using our platform.",
  robots: { index: false, follow: false },
}

const LAST_UPDATED = "March 12, 2026"
const CONTACT_EMAIL = "legal@budgetpartner.com"

export default function TermsOfServicePage() {
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

        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-muted-foreground [&_ul]:text-muted-foreground">

          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Budget Partner platform and related services (collectively, the &quot;Service&quot;) operated by Budget Partner (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account or using the Service, you agree to be bound by these Terms.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this requirement and have the legal capacity to enter into a binding agreement.
          </p>

          <h2>2. Account Registration</h2>
          <p>
            You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. Notify us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>{" "}
            if you suspect unauthorized access.
          </p>

          <h2>3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its related systems.</li>
            <li>Upload or transmit malware, viruses, or any harmful code.</li>
            <li>Scrape, crawl, or systematically extract data from the Service without written consent.</li>
            <li>Impersonate another person or entity.</li>
            <li>Use the Service to process fraudulent transactions or to commit financial crimes.</li>
          </ul>

          <h2>4. Subscription Plans and Billing</h2>
          <p>
            Certain features of the Service require a paid subscription. Subscription fees are billed in advance on a monthly or annual basis as selected. All payments are processed by Stripe. Fees are non-refundable except as required by applicable law or as expressly stated in our refund policy.
          </p>
          <p>
            We reserve the right to change subscription prices upon reasonable notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.
          </p>

          <h2>5. Financial Data and No Advice</h2>
          <p>
            Budget Partner is a personal financial management tool. We do not provide financial, investment, tax, or legal advice. The information displayed in the Service is for informational purposes only. Always consult a qualified professional before making financial decisions.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Budget Partner and its licensors. You are granted a limited, non-exclusive, non-transferable license to use the Service for your personal, non-commercial purposes.
          </p>

          <h2>7. User Content</h2>
          <p>
            You retain ownership of the data you upload to the Service (e.g., transactions, notes, budgets). By using the Service, you grant us a limited license to store and process your data solely to provide and improve the Service. We will not use your financial data for advertising or sell it to third parties.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or other conduct that harms the Service or other users. You may delete your account at any time from your profile settings. Upon termination, your right to use the Service ceases immediately.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without any warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or completely secure.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Budget Partner shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, revenue, or profits, arising from your use of or inability to use the Service. Our total liability to you for any claim shall not exceed the amount you paid us in the twelve months preceding the claim.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with applicable law. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration or in the courts of competent jurisdiction, as required by law.
          </p>

          <h2>12. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes your acceptance of the revised Terms.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Budget Partner. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-6">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
