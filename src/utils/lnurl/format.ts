import { hardConfig } from "../../main/config/hard";

export function formatLightningAuth(lnurl?: string | null) {
  if (!lnurl) {
    return { lnurl: "", qr: "", button: "" };
  }

  const qr = `${hardConfig.apis.qr}/${lnurl}`;
  const button = `lightning:${lnurl}`;

  return { lnurl, qr, button };
}
