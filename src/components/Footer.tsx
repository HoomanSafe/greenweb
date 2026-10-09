import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer>
      <div className="wrap">
        <div className="brand" style={{ fontSize: "16px" }}>
          <img
            src="/assets/logo.svg"
            alt=""
            style={{ width: "24px", height: "24px" }}
          />
          Greenlight
        </div>
        <p>
          Greenlight is an independent community project built for Robinhood Chain. It is not
          affiliated with, endorsed by, or operated by Robinhood. Nothing here is financial
          advice. New tokens are high risk; do your own research.
        </p>
      </div>
    </footer>
  );
};
