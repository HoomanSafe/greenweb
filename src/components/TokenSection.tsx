import React from "react";
import { PROJECT_CONFIG } from "../config/project";

interface TokenSectionProps {
  onCopy: (txt: string) => void;
}

export const TokenSection: React.FC<TokenSectionProps> = ({ onCopy }) => {
  const [countdownStr, setCountdownStr] = React.useState<string>("00 : 00 : 00");
  const [tcWhen, setTcWhen] = React.useState<string>("");
  const [showCountdown, setShowCountdown] = React.useState<boolean>(false);

  React.useEffect(() => {
    const launchTime = Date.parse(PROJECT_CONFIG.launchAt);
    if (!launchTime) return;

    try {
      setTcWhen(
        new Date(launchTime).toLocaleString([], {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
      );
    } catch {
      // ignore
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      if (PROJECT_CONFIG.glightCa) {
        setShowCountdown(false);
        return;
      }
      const d = launchTime - Date.now();
      if (d <= 0) {
        setShowCountdown(true);
        setCountdownStr("LIVE");
        return;
      }
      const h = Math.floor(d / 3600e3);
      const m = Math.floor((d % 3600e3) / 60e3);
      const s = Math.floor((d % 60e3) / 1e3);
      setShowCountdown(true);
      setCountdownStr(`${pad(h)} : ${pad(m)} : ${pad(s)}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyContract = () => {
    if (PROJECT_CONFIG.glightCa) {
      onCopy(PROJECT_CONFIG.glightCa);
    } else {
      onCopy("");
    }
  };

  return (
    <section id="token">
      <div className="wrap">
        <div className="token">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="eyebrow">04 / The token</div>
            <h2>$GLIHT</h2>
            <p>
              The community token behind Greenlight, live on Robinhood Chain. Holders help decide
              what the radar builds next: alerts, watchlists and a Telegram bot.
            </p>
            {showCountdown && (
              <div className="tcount" id="tcount">
                <span>Launch countdown</span>
                <div className="mono" id="tcTime">
                  {countdownStr}
                </div>
                {tcWhen && <small id="tcWhen">{tcWhen}</small>}
              </div>
            )}
            <div className="ca">
              <span className="mono" id="caText">
                {PROJECT_CONFIG.glightCa || "Contract address: coming soon"}
              </span>
              <button
                className="ib"
                id="caCopy"
                onClick={handleCopyContract}
                aria-label="Copy contract"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              </button>
            </div>
          </div>
          <ul className="tk">
            <li>
              <span>Ticker</span>
              <b>$GLIHT</b>
            </li>
            <li>
              <span>Chain</span>
              <b>Robinhood Chain</b>
            </li>
            <li>
              <span>Launch</span>
              <b>Pons Launchpad</b>
            </li>
            <li>
              <span>Roadmap</span>
              <b>Alerts → Watchlist → Bot</b>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
