import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mode terminal",
};

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
