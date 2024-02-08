import { AuthOptions } from "next-auth";

import {
  lightningProvider,
  nostrProvider,
} from "../../lnauth/[...lnauth]/config";

export const authOptions: AuthOptions = {
  providers: [lightningProvider, nostrProvider],
};
