import { AuthOptions } from "next-auth";

import {
  lightningProvider,
  nostrProvider,
} from "../../pubkey/[...pubkey]/config";

export const authOptions: AuthOptions = {
  providers: [lightningProvider, nostrProvider],
};
