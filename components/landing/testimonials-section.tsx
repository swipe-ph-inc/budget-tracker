const testimonials = [
  {
    quote:
      "COINEST completely changed how I manage my finances. The dashboard gives me a clear picture of where my money goes every month.",
    name: "Jamie Smith",
    role: "Freelance Designer",
    initials: "JS",
  },
  {
    quote:
      "The saving plans feature helped me save $12,000 for my vacation in just 8 months. The progress tracking keeps me motivated.",
    name: "Alex Johnson",
    role: "Software Engineer",
    initials: "AJ",
  },
  {
    quote:
      "I love how easy it is to transfer money and pay bills. The instant transfers and payment tracking are incredibly convenient.",
    name: "Morgan Lee",
    role: "Small Business Owner",
    initials: "ML",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Testimonials</p>
          <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Loved by thousands of users
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-border bg-background p-6 sm:p-7"
            >
              {/* Stars */}
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="h-4 w-4 fill-warning text-warning" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {'"'}{t.quote}{'"'}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
