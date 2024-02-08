## About

This example demonstrates implementing a custom Lightning auth page UI.

> ⚠️ WARNING using `node-persist` is not recommended in lambda or edge environments.
>
> The reason not to use `node-persist` is that it stores session data locally in files, and in most lambda / cloud environments those files will not persist across invocations.
>
> Instead you should use persistent storage such as a database, a document store, or session storage.
>
> See the other examples in the examples folder for more info.

## Examples

#### Client-side

```tsx
// @see pages/signin.tsx for working example

import { useSession } from "next-auth/react";
import { useLightningAuth } from "next-auth-pubkey-provider/hooks";

export default function SignIn() {
  const session = useSession();
  const { lnurl, qr, button } = useLightningAuth();

  if (!lnurl) {
    return (
      <div style={{ textAlign: "center", color: "black" }}>loading...</div>
    );
  }

  return (
    <div>
      {/* ... */}
      <img
        width={500}
        height={500}
        alt="Login with Lightning QR Code"
        src={qr}
      />
      {/* ... */}
    </div>
  );
}
```

#### Server-side

```tsx
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
    <div>
      {/* ... */}
      <img
        width={500}
        height={500}
        alt="Login with Lightning QR Code"
        src={qr}
      />
      {/* ... */}
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
```

## Getting Started

#### Building `next-auth-pubkey-provider`

Before you can run this example locally, you must clone and build `next-auth-pubkey-provider`.

Essentially all that's required is running `npm i` and `npm run build` from the directory root.

#### Create env vars

Along side the `.env.example` file in this example app, create a `.env` file with the same contents and fill all of the variables with real values.

#### Running this examples

Run `npm i` to install dependencies.

Run `npm run dev` to launch the dev server and visit `localhost:3000` to view the app.
