import { HTMLAttributes } from "preact/compat";

import { hardConfig } from "../config/hard";

export function Details({ ...props }: {} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div id={hardConfig.ids.details} {...props}>
      {"Nostr extensions are the safest way to use your Nostr identity."}
      <div className="w-100 text-muted">
        <ul>
          <li>
            <a href="https://getalby.com">Alby</a>
            <br />
            available for: chrome, firefox, and safari
          </li>
          <li>
            <a href="https://www.getflamingo.org/">Flamingo</a>
            <br />
            available for: chrome
          </li>
          <li>
            <a href="https://github.com/fiatjaf/nos2x">nos2x</a>
            <br />
            available for: chrome
          </li>
          <li>
            <a href="https://diegogurpegui.com/nos2x-fox/">nos2x-fox</a>
            <br />
            available for: firefox
          </li>
          <li>
            <a href="https://github.com/fiatjaf/horse">horse</a>
            <br />
            available for: chrome
            <br />
            supports hardware signing
          </li>
        </ul>
      </div>
    </div>
  );
}
