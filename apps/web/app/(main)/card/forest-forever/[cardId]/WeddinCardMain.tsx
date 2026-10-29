"use client";

import { useMemo } from "react";
import WeddingTemplate1 from "./Weddingtemplate1";
import { DEMO_WEDDING, mapCardToWeddingView, type CardDetailsApi } from "./Weddingcard";
import { useGetCardQuery } from "@/redux/service/cardService";
import { getApiErrorMessage } from "@/lib/apiError";

export default function WeddingTemplate1Page({ cardId }: { cardId?: string | undefined }) {
  const id = cardId?.trim();
  console.log("this is card id -> ",id)
  if (!id) return <WeddingTemplate1 data={DEMO_WEDDING} isDemo />;
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

  return mapped?.view ? <WeddingTemplate1 data={mapped.view} /> : <Shell><Skeleton /></Shell>;
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: 16,
  background: "radial-gradient(90% 60% at 50% 0%, #252b3d 0%, #0f121b 70%)",
  color: "#f2eee6",
  fontFamily: "'Open Sans', system-ui, sans-serif",
};

const Shell = ({ children }: { children: React.ReactNode }) => <div style={shell}>{children}</div>;

const Skeleton = () => (
  <>
    <style>{`@keyframes wt1pulse{0%,100%{opacity:.55}50%{opacity:.9}}`}</style>
    <div
      role="status"
      aria-label="Loading card"
      style={{
        width: "min(88vw, 440px)",
        aspectRatio: "5 / 7",
        borderRadius: 3,
        background: "#1b2133",
        border: "1px solid rgba(211,173,112,.4)",
        animation: "wt1pulse 1.4s ease-in-out infinite",
      }}
    />
  </>
);

function Panel({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ maxWidth: 380, textAlign: "center", display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, color: "#d3ad70" }}>{title}</h1>
      <p style={{ margin: 0, lineHeight: 1.6, color: "rgba(242,238,230,.8)" }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{ justifySelf: "center", height: 40, padding: "0 18px", borderRadius: 999, border: "1px solid rgba(211,173,112,.55)", background: "rgba(27,33,51,.85)", color: "#efd7a6", font: "inherit", cursor: "pointer" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}