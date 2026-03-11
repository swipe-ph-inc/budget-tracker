import type { Metadata } from "next"
import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsSection } from "@/components/landing/stats-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Clairo – Smart Financial Management Made Simple",
  description:
    "Take full control of your finances with real-time analytics, seamless payments, and saving plans. Track expenses, manage invoices, and grow your savings — all in one platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Clairo – Smart Financial Management Made Simple",
    description:
      "Take full control of your finances with real-time analytics, seamless payments, and saving plans. Track expenses, manage invoices, and grow your savings.",
    url: "/",
    type: "website",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/#website`,
      url: process.env.NEXT_PUBLIC_APP_URL ?? "/",
      name: "Clairo",
      description: "Smart Financial Management Made Simple",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Clairo",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description:
        "A full-stack financial management platform with real-time analytics, seamless payments, saving plans, and invoice management.",
      offers: [
        {
          "@type": "Offer",
          name: "Free Plan",
          price: "0",
          priceCurrency: "USD",
          description: "Dashboard overview, up to 3 payment accounts, 30-day transaction history, 1 saving plan.",
        },
        {
          "@type": "Offer",
          name: "Pro Plan",
          price: "9.00",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "9.00",
            priceCurrency: "USD",
            unitText: "MONTH",
          },
          description: "Unlimited accounts, full transaction history, unlimited saving plans, advanced invoice management, full analytics.",
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/#organization`,
      name: "Clairo",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "/",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/logo-no-lable-no-bg.png`,
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
    </>
  )
}
