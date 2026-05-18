import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a2340",
        color: "#f8f4ed",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 700,
        fontSize: 124,
        letterSpacing: "-0.06em",
        borderRadius: 36,
      }}
    >
      D
      <div
        style={{
          position: "absolute",
          bottom: 38,
          right: 36,
          width: 16,
          height: 16,
          background: "#f8f4ed",
          borderRadius: "50%",
        }}
      />
    </div>,
    { ...size },
  );
}
