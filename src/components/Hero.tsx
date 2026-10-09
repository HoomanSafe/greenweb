import React from "react";
import type { DexPair } from "../types/token";
import { Radar } from "./Radar";
import { PROJECT_CONFIG } from "../config/project";
import { num, money, age, pctFormatted, escSymbol } from "../utils/formatStats";

interface HeroProps {
  tokens: DexPair[];
  onSelectToken?: (address: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ tokens, onSelectToken }) => {
  const [countdownStr, setCountdownStr] = React.useState<string>("");
  const [isLive, setIsLive] = React.useState<boolean>(true);

  React.useEffect(() => {
    const launchTime = Date.parse(PROJECT_CONFIG.launchAt);
    if (!launchTime) return;

    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      if (PROJECT_CONFIG.glightCa) {
        setIsLive(true);
        return;
      }
      const d = launchTime - Date.now();
      if (d <= 0) {
        setIsLive(true);
        return;
      }
      setIsLive(false);
      const h = Math.floor(d / 3600e3);
      const m = Math.floor((d % 3600e3) / 60e3);
      const s = Math.floor((d % 60e3) / 1e3);
      setCountdownStr(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const stats = React.useMemo(() => {
    if (!tokens.length) {
      return {
        tracked: "—",
        volume: "—",
        newest: "—",
        newestSub: "",
        topGainer: "—",
        topGainerSub: "",
      };
    }

    const tracked = String(tokens.length);
    const totalVol = tokens.reduce((s, p) => s + (num(p.volume?.h24) || 0), 0);
    const volStr = money(totalVol);

    const newest = [...tokens]
      .filter((p) => p.pairCreatedAt)
      .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))[0];

    const newestSym = newest ? escSymbol(newest.baseToken?.symbol || "") : "—";
    const newestAge = newest ? `${age(newest.pairCreatedAt)} ago` : "";

    const gainers = [...tokens].filter(
      (p) => (num(p.liquidity?.usd) || 0) >= 1000 && num(p.priceChange?.h24) != null
    );
    gainers.sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0));
    const top = gainers[0];

    const topSym = top ? escSymbol(top.baseToken?.symbol || "") : "—";
    const topPct = top ? pctFormatted(top.priceChange?.h24).text : "";

    return {
      tracked,
      volume: volStr,
      newest: newestSym,
      newestSub: newestAge,
      topGainer: topSym,
      topGainerSub: topPct,
    };
  }, [tokens]);

  return (
    <>
      <div className="scan" aria-hidden="true"></div>
      <header className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <span className="pill">
                <span className="dot"></span> Live on Robinhood Chain
              </span>

              <a className="launchbar" id="launchbar" href="#token">
                <span className="lb-tag">$GLIHT</span>
                <span id="lbText">
                  {isLive ? "is live on Robinhood Chain" : "Launching in"}
                </span>
                <b className="mono" id="lbTime">
                  {isLive ? "Trade now →" : countdownStr}
                </b>
              </a>

              <h1>
                Spot what's moving on <em>Robinhood Chain</em> first.
              </h1>
              <p className="sub">
                Greenlight is a live radar for fresh launches and trending tokens on Robinhood Chain.
                Volume, liquidity, momentum and red flags, all on one green board.
              </p>
              <div className="cta">
                <a className="btn primary" href="#board">
                  See what's hot →
                </a>
                <a className="btn" href="#how">
                  How it works
                </a>
              </div>
            </div>

            <Radar tokens={tokens} onSelectToken={onSelectToken} />
          </div>

          <div className="stats">
            <div className="stat">
              <div className="k">Tokens tracked</div>
              <div className="v" id="sTracked">
                {stats.tracked}
              </div>
            </div>
            <div className="stat">
              <div className="k">24h volume</div>
              <div className="v" id="sVol">
                {stats.volume}
              </div>
            </div>
            <div className="stat">
              <div className="k">Newest launch</div>
              <div className="v" id="sNew">
                {stats.newest}{" "}
                {stats.newestSub && <small>{stats.newestSub}</small>}
              </div>
            </div>
            <div className="stat">
              <div className="k">Top gainer 24h</div>
              <div className="v" id="sTop">
                {stats.topGainer}{" "}
                {stats.topGainerSub && <small>{stats.topGainerSub}</small>}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
