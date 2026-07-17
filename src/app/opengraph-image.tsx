import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 32,
            background: "rgba(255,255,255,0.15)",
            color: "white",
            fontSize: 72,
            fontWeight: 800,
            marginBottom: 32,
          }}
        >
          A
        </div>
        <div style={{ display: "flex", color: "white", fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>Aura</div>
        <div style={{ display: "flex", color: "rgba(255,255,255,0.85)", fontSize: 30, marginTop: 12 }}>
          Premium, minimal sosyal medya platformu
        </div>
      </div>
    ),
    { ...size }
  );
}
