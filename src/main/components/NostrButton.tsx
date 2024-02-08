import { HTMLAttributes } from "preact/compat";

import { hardConfig } from "../config/hard";

export function NostrButton({
  ...props
}: {} & HTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} id={hardConfig.ids.button}>
      Retry Nostr Extension
    </button>
  );
}
