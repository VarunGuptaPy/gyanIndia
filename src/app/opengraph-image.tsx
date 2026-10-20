import { ImageResponse } from "next/og";

export const alt = "GYAN — National Talent Hunt Examination 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0B1F3A", color: "white", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 18, height: 18, background: "#D4A83F", transform: "rotate(45deg)" }} />
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 6 }}>GYAN</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginLeft: 8 }}>Global Young Achievers Network</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, color: "#D4A83F", letterSpacing: 4 }}>NATIONAL TALENT HUNT EXAMINATION 2026</div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, marginTop: 20 }}>Every Child Has a Talent. Every Talent Deserves a Chance.</div>
        </div>
        <div style={{ display: "flex", gap: 40, fontSize: 26, color: "rgba(255,255,255,0.8)" }}>
          <span>12 December 2026</span><span>Offline</span><span>English &amp; Hindi</span><span>www.gyanindia.com</span>
        </div>
      </div>
    ),
    size,
  );
}
