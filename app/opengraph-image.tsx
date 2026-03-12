import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Budget Partner – Smart Financial Management Made Simple"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#032e6d",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(40,192,149,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(40,192,149,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo / Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Icon mark — 4 rounded squares */}
          <div style={{ display: "flex", flexWrap: "wrap", width: 44, height: 44, gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: i === 0 ? "#032e6d" : i === 1 ? "#28c095" : i === 2 ? "#28c095" : "#032e6d",
                  opacity: i === 0 || i === 3 ? 1 : 0.6,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.5px" }}>
            Budget Partner
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: "-1.5px",
            }}
          >
            Smart Financial
            <br />
            <span style={{ color: "#28c095" }}>Management</span>
            <br />
            Made Simple
          </h1>
          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.55)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Track spending, manage payments, set saving goals,
            <br />
            and handle invoices — all in one place.
          </p>
        </div>

        {/* Bottom row: feature pills + URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {["Dashboard", "Payments", "Saving Plans", "Invoices"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "8px 18px",
                  borderRadius: 100,
                  border: "1px solid rgba(40,192,149,0.5)",
                  background: "rgba(40,192,149,0.15)",
                  color: "#28c095",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
            budgetpartner.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
