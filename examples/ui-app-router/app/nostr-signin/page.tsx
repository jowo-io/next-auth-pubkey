import NostrAuth from "@/app/components/NostrAuth";

import { createNostrAuth } from "next-auth-pubkey/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignIn({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  let session, error;
  try {
    session = await createNostrAuth(searchParams);
  } catch (e) {
    error = e instanceof Error ? e.message : "Something went wrong";
  }

  if (error || !session) {
    return <div style={{ textAlign: "center", color: "red" }}>{error}</div>;
  }

  return (
    <div>
      <NostrAuth session={session} />
    </div>
  );
}
