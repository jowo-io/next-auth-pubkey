## About

This example demonstrates implementing a custom Lightning auth page UI.

> ⚠️ WARNING using `node-persist` is not recommended in lambda or edge environments.
>
> The reason not to use `node-persist` is that it stores session data locally in files, and in most lambda / cloud environments those files will not persist across invocations.
>
> Instead you should use persistent storage such as a database, a document store, or session storage.
>
> See the other examples in the examples folder for more info.

## Example

```tsx
// @see app/signin/page.tsx for working example

import LightningAuth from "@/app/components/LightningAuth";

import { createLightningAuth } from "next-auth-pubkey/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  let session, error;
  try {
    session = await createLightningAuth(await searchParams);
  } catch (e) {
    error = e instanceof Error ? e.message : "Something went wrong";
  }

  if (error || !session) {
    return <div style={{ textAlign: "center", color: "red" }}>{error}</div>;
  }

  return (
    <div>
      <LightningAuth session={session} />
    </div>
  );
}
```

```tsx
// @see app/components/LightningAuth.tsx for working example

"use client";

import { useLightningPolling } from "next-auth-pubkey/hooks";
import { NextAuthPubkeyClientSession } from "next-auth-pubkey/server";

export default function LightningAuth({
  session,
}: {
  session: NextAuthPubkeyClientSession;
}) {
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
```

## Getting Started

#### Building `next-auth-pubkey`

Before you can run this example locally, you must clone and build `next-auth-pubkey`.

Essentially all that's required is running `npm i` and `npm run build` from the directory root.

#### Create env vars

Along side the `.env.example` file in this example app, create a `.env` file with the same contents and fill all of the variables with real values.

#### Running this examples

Run `npm i` to install dependencies.

Run `npm run dev` to launch the dev server and visit `localhost:3000` to view the app.
