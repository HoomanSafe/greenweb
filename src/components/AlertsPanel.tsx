import React from "react";
import type { RadarAlertItem } from "../types/token";
import { age } from "../utils/helpers";

interface AlertsConfig {
  on: boolean;
  alertNew: boolean;
  alertHeat: boolean;
  heatThreshold: number;
  alertPump: boolean;
  pumpThreshold: number;
  alertDump: boolean;
  sound: boolean;
}

interface AlertsPanelProps {
  config: AlertsConfig;
  onUpdateConfig: (newConfig: Partial<AlertsConfig>) => void;
  feed: RadarAlertItem[];
  onClearFeed: () => void;
  onTrade: (key: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  unreadCount: number;
  onShowToast: (msg: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  config,
  onUpdateConfig,
  feed,
  onClearFeed,
  onTrade,
  isOpen,
  onToggle,
  unreadCount,
  onShowToast,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);

  const requestDesktopNotifications = async () => {
    try {
      if (!("Notification" in window)) {
        onShowToast("Notifications not supported here");
        return;
      }
      const r = await Notification.requestPermission();
      onShowToast(r === "granted" ? "Desktop alerts on" : "Notifications blocked");
    } catch {
      onShowToast("Notifications not available");
    }
  };

  return (
    <div className="alwrap">
      <button
        className="btn albtn"
        id="alBtn"
        style={{ padding: "6px 12px", fontSize: "13px" }}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        🔔 Alerts{" "}
        {unreadCount > 0 && !isOpen && (
          <span className="albadge" id="alBadge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="alpanel glass" id="alPanel" ref={panelRef}>
          <div className="alhead">
            <b>Radar alerts</b>
            <label className="sw">
              <input
                type="checkbox"
                checked={config.on}
                onChange={(e) => onUpdateConfig({ on: e.target.checked })}
              />
              <i></i>
            </label>
          </div>

          <label className="alrow">
            <input
              type="checkbox"
              checked={config.alertNew}
              onChange={(e) => onUpdateConfig({ alertNew: e.target.checked })}
            />{" "}
            🌱 New tokens on the radar
          </label>

          <label className="alrow">
            <input
              type="checkbox"
              checked={config.alertHeat}
              onChange={(e) => onUpdateConfig({ alertHeat: e.target.checked })}
            />{" "}
            🔥 Heat reaches{" "}
            <input
              type="number"
              value={config.heatThreshold}
              min="10"
              max="100"
              step="5"
              onChange={(e) => onUpdateConfig({ heatThreshold: Number(e.target.value) || 75 })}
            />
          </label>

          <label className="alrow">
            <input
              type="checkbox"
              checked={config.alertPump}
              onChange={(e) => onUpdateConfig({ alertPump: e.target.checked })}
            />{" "}
            🚀 1h move over +
            <input
              type="number"
              value={config.pumpThreshold}
              min="5"
              max="500"
              step="5"
              onChange={(e) => onUpdateConfig({ pumpThreshold: Number(e.target.value) || 25 })}
            />
            %
          </label>

          <label className="alrow">
            <input
              type="checkbox"
              checked={config.alertDump}
              onChange={(e) => onUpdateConfig({ alertDump: e.target.checked })}
            />{" "}
            ⚠️ Heavy selling starts
          </label>

          <div className="alopts">
            <button
              className="btn"
              onClick={requestDesktopNotifications}
              style={{ padding: "6px 10px", fontSize: "12px" }}
            >
              Enable desktop notifications
            </button>
            <label className="alrow" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={config.sound}
                onChange={(e) => onUpdateConfig({ sound: e.target.checked })}
              />{" "}
              🔊 Sound
            </label>
          </div>

          <div className="alfeedh">
            Recent alerts <button onClick={onClearFeed}>clear</button>
          </div>

          <div className="alfeed" id="alFeed">
            {feed.length ? (
              feed.map((a, i) => (
                <div className="alitem" key={`${a.key}-${a.t}-${i}`}>
                  <span className="ae">{a.emoji}</span>
                  <div className="at">
                    <b>
                      ${a.sym} · {a.title}
                    </b>
                    <span>
                      {a.detail} · {age(a.t)} ago
                    </span>
                  </div>
                  <button className="tbtn" onClick={() => onTrade(a.key)}>
                    Trade
                  </button>
                </div>
              ))
            ) : (
              <div className="alempty">
                Waiting for the next scan… alerts appear here as tokens move.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
