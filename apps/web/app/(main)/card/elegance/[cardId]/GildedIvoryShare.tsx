"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GildedIvoryTemplate from "./GildedIvoryTemplate";
import { mapCardToWeddingView, type CardDetailsApi } from "./GildedIvoryData";
import { useGetPublicCardQuery } from "@/redux/service/publicCardService";
import { getApiErrorMessage } from "@/lib/apiError";

/** Must match this template's folder name under app/(main)/card/ */
const TEMPLATE_SLUG = "gilded-ivory";

/**
 * What a guest sees: the card, opened straight in the full-page guest view.
 * No Pay, Download or Share controls: those live in the owner's layout and are not rendered here.
 * "Exit" leaves the guest view and shows the card inside the normal site (header and footer).
 */
export default function GildedIvoryShare({ publicSlug }: { publicSlug: string }) {
  const router = useRouter();
  const { data, error, isLoading } = useGetPublicCardQuery(publicSlug);
  const payload = data?.data;

  // A link opened under the wrong template folder goes to the right one.
  useEffect(() => {
    if (payload && payload.templateSlug !== TEMPLATE_SLUG) {
      router.replace(`/card/${payload.templateSlug}/${publicSlug}/share`);
    }
  }, [payload, publicSlug, router]);

  const mapped = useMemo(() => {
    if (!payload) return null;
    try {
      return { view: mapCardToWeddingView(payload.details as unknown as CardDetailsApi), error: null };
    } catch (e) {
      return { view: null, error: e instanceof Error ? e.message : "This card can't be displayed." };
    }
  }, [payload]);

  if (isLoading) return <Frame><Skeleton /></Frame>;

  if (error) {
    const status = (error as { status?: number }).status;
    return (
      <Frame>
        <Message
          title={status === 404 ? "This invitation link isn't valid" : "We couldn't open this invitation"}
          text={status === 404 ? "The link may be incomplete, or the card was removed." : getApiErrorMessage(error)}
        />
      </Frame>
    );
  }

  if (mapped?.error) {
    return (
      <Frame>
        <Message title="This invitation can't be displayed" text={mapped.error} />
      </Frame>
    );
  }

  if (!mapped?.view || payload?.templateSlug !== TEMPLATE_SLUG) return <Frame><Skeleton /></Frame>;

  return <GildedIvoryTemplate data={mapped.view} startInGuest />;
}

/* ---------------- small helpers ---------------- */
const Frame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: 16,
      background: "radial-gradient(90% 60% at 50% 0%, #f3ead9 0%, #b9a283 100%)",
      color: "#5d4632",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}
  >
    {children}
  </div>
);

const Skeleton = () => (
  <>
    <style>{`@keyframes gipulse{0%,100%{opacity:.6}50%{opacity:.95}}`}</style>
    <div
      role="status"
      aria-label="Loading invitation"
      style={{ width: "min(88vw, 440px)", aspectRatio: "2 / 3", borderRadius: 3, background: "#f6efe1", border: "1px solid rgba(184,138,62,.55)", animation: "gipulse 1.4s ease-in-out infinite" }}
    />
  </>
);

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div role="alert" style={{ maxWidth: 380, textAlign: "center", display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontFamily: "'Great Vibes', cursive", fontSize: 34, color: "#8f6430" }}>{title}</h1>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{text}</p>
      <Link href="/" style={{ justifySelf: "center", color: "#6b4a22", textUnderlineOffset: 4 }}>
        Go to the home page
      </Link>
    </div>
  );
}
