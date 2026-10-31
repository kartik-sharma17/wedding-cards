"use client";

import { useMemo } from "react";
import LavenderBloomTemplate from "./LavenderBloomTemplate";
import { DEMO_LAVENDER, mapCardToWeddingView, type CardDetailsApi } from "./LavenderBloomData";
import { useGetCardQuery } from "@/redux/service/cardService";
import { getApiErrorMessage } from "@/lib/apiError";

export default function LavenderBloomPage({ cardId }: { cardId?: string | undefined }) {
  const id = cardId?.trim();
  if (!id) return <LavenderBloomTemplate data={DEMO_LAVENDER} isDemo />;
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

  return mapped?.view ? <LavenderBloomTemplate data={mapped.view} /> : <Shell><Skeleton /></Shell>;
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: 16,
  background: "radial-gradient(90% 60% at 50% 0%, #ece8f8 0%, #b3a6d8 100%)",
  color: "#4d4859",
  fontFamily: "'Montserrat', system-ui, sans-serif",
};

const Shell = ({ children }: { children: React.ReactNode }) => <div style={shell}>{children}</div>;

const Skeleton = () => (
  <>
    <style>{`@keyframes lbpulse{0%,100%{opacity:.6}50%{opacity:.95}}`}</style>
    <div
      role="status"
      aria-label="Loading card"
      style={{
        width: "min(88vw, 440px)",
        aspectRatio: "5 / 7",
        borderRadius: 3,
        background: "#f1edf9",
        border: "1px solid rgba(201,169,92,.55)",
        animation: "lbpulse 1.4s ease-in-out infinite",
      }}
    />
  </>
);

function Panel({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ maxWidth: 380, textAlign: "center", display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontFamily: "'Dancing Script', cursive", fontSize: 30, color: "#5d4d8f" }}>{title}</h1>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{ justifySelf: "center", height: 40, padding: "0 18px", borderRadius: 999, border: "1px solid rgba(123,106,168,.6)", background: "rgba(255,255,255,.88)", color: "#4e3f7d", font: "inherit", cursor: "pointer" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
