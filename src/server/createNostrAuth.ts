import { cleanParams } from "../main/utils/params";
import { hardConfig } from "../main/config";
import { NostrClientSession } from "./types";

export default async function createNostrAuth(
  searchParams: Record<string, string | string[] | undefined | null>
): Promise<NostrClientSession> {
  const {
    client_id: baseUrl = "",
    state = "",
    redirect_uri: redirectUri = "",
  } = cleanParams(searchParams);
  if (!baseUrl || !redirectUri || !state) {
    throw new Error("Missing query params");
  }

  const params = new URLSearchParams({ state });
  const response = await fetch(baseUrl + hardConfig.apis.create, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params,
    cache: "no-cache",
  });
  const data = await response.json();

  if (!data.lnurl) {
    throw new Error("Missing lnurl");
  }

  return {
    data: {
      k1: data.k1,
    },
    query: { state, redirectUri },
  };
}
