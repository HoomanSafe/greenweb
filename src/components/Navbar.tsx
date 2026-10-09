import React from "react";
import { PROJECT_CONFIG } from "../config/project";

export const Navbar: React.FC = () => {
  return (
    <nav>
      <div className="wrap">
        <a href="#" className="brand">
          <img src="/assets/logo.svg" alt="" style={{ width: "32px", height: "32px" }} />
          Greenlight
        </a>
        <div className="navlinks">
          <a href="#board">Live board</a>
          <a href="#how">How it works</a>
          <a href="#token">$GREENLIGHT</a>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            className="btn"
            href={PROJECT_CONFIG.xUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="xlink"
            aria-label="X"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9 2H22l-7.4 8.5L23.3 22h-6.8l-5.3-6.9L5 22H1.9l7.9-9.1L1.5 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z" />
            </svg>
          </a>
          <a className="btn primary" href="#board">
            Open radar
          </a>
        </div>
      </div>
    </nav>
  );
};
