import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 6,
          border: "2px solid #588157",
          color: "#A3B18A",
          fontSize: 17,
          fontWeight: 700,
        }}
      >
        {">_"}
      </div>
    ),
    size,
  );
}
