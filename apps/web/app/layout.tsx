import type { Metadata } from "next";
import {
  Anton,
  Cormorant_Garamond,
  Great_Vibes,
  Jost,
  Poppins,
} from "next/font/google";
import SmoothScrollProvider from "@/components/layout/SmoothScrollProvider";
import "./globals.css";

const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });

export const metadata: Metadata = {
  title: "Shaan – Online invitation cards in minutes",
  description:
    "Create beautiful invitation cards in minutes, share them free with your relatives, and download them from just ₹249.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${cormorant.variable} ${greatVibes.variable} ${poppins.variable} ${anton.variable}`}
    >
      <body>
        {/* TODO: wrap with your existing Redux <Provider> / StoreProvider here */}
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
