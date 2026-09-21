import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name} — Portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          padding: 72,
          border: "2px solid #344E41",
        }}
      >
        <div style={{ display: "flex", color: "#588157", fontSize: 34, fontWeight: 700 }}>
          {"$ ls projects/"}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "#DAD7CD", fontSize: 128, fontWeight: 800, letterSpacing: -3 }}>
            {profile.name}
          </div>
          <div style={{ display: "flex", color: "#A3B18A", fontSize: 40, marginTop: 8 }}>
            {profile.tagline}
          </div>
        </div>

        <div style={{ display: "flex", color: "#6b7280", fontSize: 30 }}>
          marleyportfolio.fr
        </div>
      </div>
    ),
    size,
  );
}
