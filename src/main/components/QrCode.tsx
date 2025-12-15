import { HTMLAttributes } from "preact/compat";

import { formatLightningAuth } from "../../utils/lnurl/format";
import { hardConfig } from "../config/hard";

export function QrCode({
  lnurl,
  ...props
}: {
  lnurl: string;
} & HTMLAttributes<HTMLImageElement>) {
  const { qr } = formatLightningAuth(lnurl);

  return (
    <img
      width={500}
      height={500}
      alt="Login with Lightning QR Code"
      {...props}
      id={hardConfig.ids.qr}
      src={qr}
    />
  );
}
