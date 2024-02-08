"use client";

import { useLightningPolling } from "next-auth-pubkey-provider/hooks";
import { NextAuthLightningClientSession } from "next-auth-pubkey-provider/server";

export default function LightningAuth({
  session,
}: {
  session: NextAuthLightningClientSession;
}) {
  const { lnurl, qr, button } = useLightningPolling(session);

  return (
    <div
      style={{
        margin: "auto",
        maxWidth: 400,
        textAlign: "center",
        background: "#fff",
        color: "#000",
        padding: "20px 30px",
        borderRadius: 20,
      }}
    >
      <h1
        style={{
          fontSize: 20,
          color: "#000",
          marginTop: 0,
          marginBottom: 15,
        }}
      >
        Plain JSX
      </h1>
      <img
        width={500}
        height={500}
        alt="Login with Lightning QR Code"
        style={{
          display: "block",
          overflow: "hidden",
          borderRadius: 5,
          width: "100%",
          height: "auto",
        }}
        src={qr}
      />
      <pre
        style={{
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
          userSelect: "all",
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        {lnurl}
      </pre>

      <a
        style={{
          alignItems: "center",
          backgroundColor: "#f2f2f2",
          textDecoration: "none",
          border: `2px solid rgba(110, 110, 110, 0.3)`,
          borderRadius: 10,
          color: "#000",
          display: "flex",
          fontSize: "1.1rem",
          fontWeight: "500",
          justifyContent: "center",
          minHeight: "30px",
          padding: ".75rem 1rem",
          position: "relative",
        }}
        href={button}
      >
        Open Lightning Wallet
      </a>
    </div>
  );
}
