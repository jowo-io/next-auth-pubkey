// to enable this SSR sign in page, update the `config.signIn` options to `/lightning-signin-ssr` in the `/pages/api/lnauth/[...lnauth].ts` file

import { GetServerSidePropsContext } from "next";
import {
  NextAuthLightningClientSession,
  createLightningAuth,
} from "next-auth-pubkey-provider/server";
import { useLightningPolling } from "next-auth-pubkey-provider/hooks";

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  let session = null,
    error = null;
  try {
    session = await createLightningAuth(context.query);
  } catch (e) {
    error = e instanceof Error ? e.message : "Something went wrong";
  }

  return {
    props: { s: session, e: error },
  };
};

function SignIn({ session }: { session: NextAuthLightningClientSession }) {
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

export default function SignInPage({
  s: session,
  e: error,
}: {
  s: NextAuthLightningClientSession | null;
  e: string | null;
}) {
  if (error || !session) {
    return <div style={{ textAlign: "center", color: "black" }}>{error}</div>;
  }

  return <SignIn session={session} />;
}
