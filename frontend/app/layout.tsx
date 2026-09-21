import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "Portfolio : projets, CV et liens, en mode terminal ou version simplifiée.";

export const metadata: Metadata = {
  metadataBase: new URL("https://marleyportfolio.fr"),
  title: {
    default: "Marley — Portfolio",
    template: "%s | Marley",
  },
  description,
  openGraph: {
    title: "Marley — Portfolio",
    description,
    url: "/",
    siteName: "Marley — Portfolio",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marley — Portfolio",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
