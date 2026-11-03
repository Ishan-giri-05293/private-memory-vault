import type React from "react";
import type { Metadata, Viewport } from "next";
import { Nunito, Pixelify_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sky, { Meadow } from "@/components/Sky";
import BirthdayDecor from "@/components/BirthdayDecor";
import Rabbits from "@/components/Rabbits";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-pixelify",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "A Space for You",
  description: "A little pixel sky of memories, made for Aru",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#a98cf0",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${pixelify.variable} ${nunito.variable}`}
    >
      <body className="min-h-dvh">
        {/* the sky sits at the back; the meadow and bunnies sit in front of the page */}
        <Sky />
        <BirthdayDecor />
        <Navbar />
        <div className="relative">{children}</div>
        <Meadow />
        <Rabbits />
        <Analytics />
      </body>
    </html>
  );
}
