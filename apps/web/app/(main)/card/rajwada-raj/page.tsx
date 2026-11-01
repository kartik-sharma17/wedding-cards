// app/(main)/card/rajwada-romance/page.tsx
// Demo route: /card/rajwada-romance  (no cardId, so the template shows its sample data).
// Real cards live at /card/rajwada-romance/[cardId].
import type { Metadata } from "next";
import RajwadaRomancePage from "./[cardId]/RajwadaRomanceMain";

export const metadata: Metadata = {
  title: "Rajwada Romance Wedding Invitation Card",
  description:
    "Preview the Rajwada Romance royal Indian wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
  keywords: ["royal indian wedding invitation card", "palace theme wedding card", "rajasthani wedding invitation", "online wedding invitation maker"],
  openGraph: {
    title: "Rajwada Romance Wedding Invitation Card | Festa Cards",
    description:
      "Preview the Rajwada Romance royal Indian wedding invitation card with sample details. Create your own in minutes, share it free on WhatsApp and download from ₹249.",
    images: ["/og-image.png"],
  },
};

export default function DemoPage() {
  return <RajwadaRomancePage />;
}
