import LightningAuth from "@/app/components/LightningAuth";

import { createLightningAuth } from "next-auth-pubkey/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignIn({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  let session, error;
  try {
    session = await createLightningAuth(searchParams);
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
