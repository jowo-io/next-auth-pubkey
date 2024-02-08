import NextAuth, { AuthOptions } from "next-auth";

import { lightningProvider, nostrProvider } from "../lnauth/[...lnauth]";

export const authOptions: AuthOptions = {
  providers: [lightningProvider, nostrProvider],
};

export default NextAuth(authOptions);
