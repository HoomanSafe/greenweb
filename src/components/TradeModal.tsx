import React from "react";
import type { DexPair } from "../types/token";
import { heatOf, sym, price, pctFormatted, money, getFlags } from "../utils/helpers";

interface TradeModalProps {
  token: DexPair | null;
  onClose: () => void;
  onCopy: (txt: string) => void;
}

const UNI = "https://app.uniswap.org/swap?chain=robinhood";

export const TradeModal: React.FC<TradeModalProps> = ({ token, onClose, onCopy }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (token) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [token, onClose]);

  if (!token) return null;

  const t = token.baseToken;
  const ca = t?.address || "";
  const heat = token._heat ?? heatOf(token);
  const onUni = (token.dexId || "").toLowerCase().includes("uniswap");
  const dexName = (token.dexId || "DEX").replace(/^./, (c) => c.toUpperCase());
  const buy = `${UNI}&inputCurrency=ETH&outputCurrency=${ca}`;
  const sell = `${UNI}&inputCurrency=${ca}&outputCurrency=ETH`;
  const flags = getFlags(token);
  const p1h = pctFormatted(token.priceChange?.h1);
  const p24 = pctFormatted(token.priceChange?.h24);

  return (
    <div
      className="tmodal on"
      id="trade"
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="tpanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="ib tclose" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="top" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="ico">
            {token.info?.imageUrl ? (
              <img
                src={token.info.imageUrl}
                alt=""
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              (t?.symbol || "?").slice(0, 2)
            )}
          </div>
          <div>
            <h3 id="tTitle" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "24px", lineHeight: "1.1" }}>
              ${sym(token)}
            </h3>
            <div style={{ color: "var(--dim)", fontSize: "13px" }}>
              {t?.name} · {dexName}
            </div>
          </div>
        </div>

        <div className="tgrid">
          <div>
            <span>Price</span>
            <b className="mono" dangerouslySetInnerHTML={{ __html: price(token.priceUsd) }}></b>
          </div>
          <div>
            <span>1h / 24h</span>
            <b>
              <span className={p1h.className}>{p1h.text}</span>{" "}
              <span className={p24.className}>{p24.text}</span>
            </b>
          </div>
          <div>
            <span>Liquidity</span>
            <b>{money(token.liquidity?.usd)}</b>
          </div>
          <div>
            <span>Heat</span>
            <b className="mono" style={{ color: "var(--green)" }}>
              {heat}/100
            </b>
          </div>
        </div>

        {flags.length > 0 && (
          <div className="flags" style={{ margin: "4px 0 10px" }}>
            {flags.map((f, i) => (
              <span key={i} className={f.className}>
                {f.label}
              </span>
            ))}
          </div>
        )}

        <div className="tca mono">
          <span>{ca}</span>
          <button
            className="ib"
            onClick={() => onCopy(ca)}
            aria-label="Copy contract"
          >
            ⧉
          </button>
        </div>

        {onUni ? (
          <>
            <div className="tacts">
              <a className="btn primary" href={buy} target="_blank" rel="noopener noreferrer">
                Buy with ETH ↗
              </a>
              <a className="btn sellb" href={sell} target="_blank" rel="noopener noreferrer">
                Sell for ETH ↗
              </a>
            </div>
            <p className="tnote">
              Opens Uniswap on Robinhood Chain with this token pre-filled. You connect your own wallet and confirm the swap there.
            </p>
          </>
        ) : (
          <>
            <div className="tacts">
              <a className="btn primary" href={token.url} target="_blank" rel="noopener noreferrer">
                Trade on {dexName} ↗
              </a>
            </div>
            <p className="tnote">
              This token trades on {dexName}, not Uniswap yet. The link opens its live pair page where you can reach the trading venue.
            </p>
          </>
        )}

        <a
          className="btn"
          href={token.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
        >
          View live chart ↗
        </a>

        <div className="twarn">
          ⚠️ Greenlight never holds your funds and never asks for your seed phrase. Always double-check the contract address before swapping. New tokens are high risk. Not financial advice.
        </div>
      </div>
    </div>
  );
};
