"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#F7F9FC", color: "#172033" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ color: "#0B1F3A" }}>Something went wrong</h1>
          <p>Please try again. If the problem continues, contact admin@gyanindia.com.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#174EA6", color: "#fff", cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
