"use client";

import { useMemo } from "react";
import RajwadaRomanceTemplate from "./RajwadaRomanceTemplate";
import { DEMO_RAJWADA, mapCardToWeddingView, type CardDetailsApi } from "./RajwadaRomanceData";
import { useGetCardQuery } from "@/redux/service/cardService";
import { getApiErrorMessage } from "@/lib/apiError";

export default function RajwadaRomancePage({ cardId }: { cardId?: string | undefined }) {
  const id = cardId?.trim();
  if (!id) return <RajwadaRomanceTemplate data={DEMO_RAJWADA} isDemo />;
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

  return mapped?.view ? <RajwadaRomanceTemplate data={mapped.view} /> : <Shell><Skeleton /></Shell>;
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: 16,
  background: "radial-gradient(90% 60% at 50% 0%, #efe4d2 0%, #b8a183 100%)",
  color: "#5e3438",
  fontFamily: "'Marcellus', Georgia, serif",
};

const Shell = ({ children }: { children: React.ReactNode }) => <div style={shell}>{children}</div>;

const Skeleton = () => (
  <>
    <style>{`@keyframes rrpulse{0%,100%{opacity:.6}50%{opacity:.95}}`}</style>
    <div
      role="status"
      aria-label="Loading card"
      style={{
        width: "min(88vw, 440px)",
        aspectRatio: "5 / 7",
        borderRadius: 3,
        background: "#efe6d4",
        border: "1px solid rgba(184,145,79,.6)",
        animation: "rrpulse 1.4s ease-in-out infinite",
      }}
    />
  </>
);

function Panel({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ maxWidth: 380, textAlign: "center", display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0, fontFamily: "'Pinyon Script', cursive", fontSize: 32, color: "#7a2b3b" }}>{title}</h1>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{ justifySelf: "center", height: 40, padding: "0 18px", borderRadius: 999, border: "1px solid rgba(184,145,79,.7)", background: "rgba(255,250,240,.9)", color: "#6b2a36", font: "inherit", cursor: "pointer" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
