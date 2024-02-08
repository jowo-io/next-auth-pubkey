"use client";

import { useNostrExtension } from "next-auth-pubkey-provider/hooks";
import { NextAuthNostrClientSession } from "next-auth-pubkey-provider/server";

export default function NostrAuth({
  session,
}: {
  session: NextAuthNostrClientSession;
}) {
  const { error, retry } = useNostrExtension(session);

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

      {!error && <div>Opening Nostr extension....</div>}

      {error && (
        <>
          <div
            style={{
              fontSize: 16,
              color: "red",
              marginTop: 0,
            }}
          >
            {error}
          </div>

          <div
            style={{
              marginTop: 15,
              textAlign: "left",
            }}
          >
            {"Nostr extensions are the safest way to use your Nostr identity."}
            <div className="w-100 text-muted">
              <ul>
                <li>
                  <a href="https://getalby.com">Alby</a>
                  <br />
                  available for: chrome, firefox, and safari
                </li>
                <li>
                  <a href="https://www.getflamingo.org/">Flamingo</a>
                  <br />
                  available for: chrome
                </li>
                <li>
                  <a href="https://github.com/fiatjaf/nos2x">nos2x</a>
                  <br />
                  available for: chrome
                </li>
                <li>
                  <a href="https://diegogurpegui.com/nos2x-fox/">nos2x-fox</a>
                  <br />
                  available for: firefox
                </li>
                <li>
                  <a href="https://github.com/fiatjaf/horse">horse</a>
                  <br />
                  available for: chrome
                  <br />
                  supports hardware signing
                </li>
              </ul>
            </div>
          </div>

          {retry && (
            <button
              onClick={retry}
              style={{
                display: "flex",
                margin: "auto",
                alignItems: "center",
                backgroundColor: "#f2f2f2",
                textDecoration: "none",
                border: `2px solid rgba(110, 110, 110, 0.3)`,
                borderRadius: 10,
                color: "#000",
                fontSize: "1.1rem",
                fontWeight: "500",
                justifyContent: "center",
                minHeight: "30px",
                padding: ".75rem 1rem",
                position: "relative",
                cursor: "pointer",
              }}
            >
              Retry Nostr Extension
            </button>
          )}
        </>
      )}
    </div>
  );
}
