"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LavenderBloomTemplate from "./LavenderBloomTemplate";
import { mapCardToWeddingView, type CardDetailsApi } from "./LavenderBloomData";
import { useGetPublicCardQuery } from "@/redux/service/publicCardService";
import { getApiErrorMessage } from "@/lib/apiError";

/** Must match this template's folder name under app/(main)/card/ */
const TEMPLATE_SLUG = "lavender-bloom";

/**
 * What a guest sees: the card, opened straight in the full-page guest view.
 * No Pay, Download or Share controls: those live in the owner's layout and are not rendered here.
 * "Exit" leaves the guest view and shows the card inside the normal site (header and footer).
 */
export default function LavenderBloomShare({ publicSlug }: { publicSlug: string }) {
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

  return <LavenderBloomTemplate data={mapped.view} startInGuest />;
}

/* ---------------- small helpers ---------------- */
const Frame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: 16,
      background: "radial-gradient(90% 60% at 50% 0%, #ece8f8 0%, #b3a6d8 100%)",
      color: "#4d4859",
      fontFamily: "'Montserrat', system-ui, sans-serif",
    }}
  >
    {children}
  </div>
);

const Skeleton = () => (
  <>
    <style>{`@keyframes lbpulse{0%,100%{opacity:.6}50%{opacity:.95}}`}</style>
    <div
      role="status"
      aria-label="Loading invitation"
      style={{ width: "min(88vw, 440px)", aspectRatio: "5 / 7", borderRadius: 3, background: "#f1edf9", border: "1px solid rgba(201,169,92,.55)", animation: "lbpulse 1.4s ease-in-out infinite" }}
    />
  </>
);

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div role="alert" style={{ maxWidth: 380, textAlign: "center", display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontFamily: "'Dancing Script', cursive", fontSize: 30, color: "#5d4d8f" }}>{title}</h1>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{text}</p>
      <Link href="/" style={{ justifySelf: "center", color: "#4e3f7d", textUnderlineOffset: 4 }}>
        Go to the home page
      </Link>
    </div>
  );
}
