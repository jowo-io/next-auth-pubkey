import { HTMLAttributes } from "preact/compat";

import { formatLightningAuth } from "../../utils/lnurl";
import { hardConfig } from "../config/hard";

export function LightningButton({
  lnurl,
  ...props
}: {
  lnurl: string;
} & HTMLAttributes<HTMLAnchorElement>) {
  const { button } = formatLightningAuth(lnurl);

  return (
    <a {...props} id={hardConfig.ids.button} href={button}>
      Open Lightning Wallet
    </a>
  );
}
