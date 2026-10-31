import type { Metadata,Viewport } from "next";
import {
  Anton,
  Cormorant_Garamond,
  Great_Vibes,
  Jost,
  Poppins,
  Geist,
} from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import SmoothScrollProvider from "../components/layout/SmoothScrollProvider";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ReduxProvider } from "@/redux/reduxProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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

const NAME = "Festa Cards"; // swap for SITE.name if you like
const TITLE = "Festa Cards: Online Invitation Maker for Weddings & Events";
const DESCRIPTION =
  "Make wedding, birthday, baby shower and anniversary invitation cards online in minutes. Share with family on WhatsApp for free. Download from just ₹249.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: TITLE, template: `%s | ${NAME}` },
  description: DESCRIPTION,
  applicationName: NAME,
  keywords: [
    "online invitation card maker",
    "wedding invitation card maker",
    "digital invitation card",
    "e-invite maker",
    "WhatsApp invitation card",
    "invitation card maker India",
  ],
  openGraph: {
    type: "website",
    siteName: NAME,
    locale: "en_IN",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${NAME}: online invitation cards` }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og-image.png"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0c272a" };

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(
        jost.variable,
        cormorant.variable,
        greatVibes.variable,
        poppins.variable,
        anton.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ReduxProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </ReduxProvider>
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}