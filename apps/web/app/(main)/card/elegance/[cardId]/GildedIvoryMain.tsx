"use client";

import { useMemo } from "react";
import GildedIvoryTemplate from "./GildedIvoryTemplate";
import { DEMO_GILDED, mapCardToWeddingView, type CardDetailsApi } from "./GildedIvoryData";
import { useGetCardQuery } from "@/redux/service/cardService";
import { getApiErrorMessage } from "@/lib/apiError";

export default function GildedIvoryPage({ cardId }: { cardId?: string | undefined }) {
  const id = cardId?.trim();
  if (!id) return <GildedIvoryTemplate data={DEMO_GILDED} isDemo />;
  return <CardFromApi cardId={id} />;
}

function CardFromApi({ cardId }: { cardId: string }) {
  const { data, error, isLoading, isFetching, refetch } = useGetCardQuery(cardId);

  const mapped = useMemo(() => {
    const details = data?.data?.details || {};
    if (!details) return null;
    try {
      return { view: mapCardToWeddingView(details as unknown as CardDetailsApi), error: null };
    } catch (e) {
      return { view: null, error: e instanceof Error ? e.message : "This card can't be displayed." };
    }
  }, [data]);

  if (isLoading) return <Shell><Skeleton /></Shell>;

  if (error || (!isFetching && !mapped)) {
    return (
      <Shell>
        <Panel title="We couldn't load this card" message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      </Shell>
    );
  }

  if (mapped?.error) {
    return (
      <Shell>
        <Panel title="This card can't be displayed" message={mapped.error} />
      </Shell>
    );
  }

  return mapped?.view ? <GildedIvoryTemplate data={mapped.view} /> : <Shell><Skeleton /></Shell>;
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: 16,
  background: "radial-gradient(90% 60% at 50% 0%, #f3ead9 0%, #b9a283 100%)",
  color: "#5d4632",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};

const Shell = ({ children }: { children: React.ReactNode }) => <div style={shell}>{children}</div>;

const Skeleton = () => (
  <>
    <style>{`@keyframes gipulse{0%,100%{opacity:.6}50%{opacity:.95}}`}</style>
    <div
      role="status"
      aria-label="Loading card"
      style={{
        width: "min(88vw, 440px)",
        aspectRatio: "2 / 3",
        borderRadius: 3,
        background: "#f6efe1",
        border: "1px solid rgba(184,138,62,.55)",
        animation: "gipulse 1.4s ease-in-out infinite",
      }}
    />
  </>
);

function Panel({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ maxWidth: 380, textAlign: "center", display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontFamily: "'Great Vibes', cursive", fontSize: 34, color: "#8f6430" }}>{title}</h1>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{ justifySelf: "center", height: 40, padding: "0 18px", borderRadius: 999, border: "1px solid rgba(184,138,62,.65)", background: "rgba(255,251,242,.9)", color: "#6b4a22", font: "inherit", cursor: "pointer" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
