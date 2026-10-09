import React from "react";
import type { DexPair } from "../types/token";
import { num, price, pctFormatted, sym } from "../utils/helpers";

interface TickerProps {
  tokens: DexPair[];
}

export const Ticker: React.FC<TickerProps> = ({ tokens }) => {
  const movers = React.useMemo(() => {
    return tokens
      .filter((p) => num(p.priceChange?.h1) != null)
      .sort((a, b) => Math.abs(b.priceChange?.h1 || 0) - Math.abs(a.priceChange?.h1 || 0))
      .slice(0, 16);
  }, [tokens]);

  if (!movers.length) {
    return (
      <div className="ticker" aria-label="Top movers">
        <div className="track" id="track">
          <span className="live">● SCANNING ROBINHOOD CHAIN…</span>
        </div>
      </div>
    );
  }

  const renderGroup = (keySuffix: string) => (
    <React.Fragment key={keySuffix}>
      <span className="live">● LIVE 1H MOVERS</span>
      {movers.map((p, idx) => {
        const pct = pctFormatted(p.priceChange?.h1);
        return (
          <a
            key={`${p.baseToken?.address || idx}-${keySuffix}`}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <b>${sym(p)}</b>
            <span
              className="mono"
              style={{ color: "var(--muted)" }}
              dangerouslySetInnerHTML={{ __html: price(p.priceUsd) }}
            />
            <span className={pct.className}>{pct.text}</span>
          </a>
        );
      })}
    </React.Fragment>
  );

  return (
    <div className="ticker" aria-label="Top movers">
      <div className="track" id="track">
        {renderGroup("group1")}
        {renderGroup("group2")}
      </div>
    </div>
  );
};
