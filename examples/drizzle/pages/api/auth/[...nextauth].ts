import NextAuth, { AuthOptions } from "next-auth";

import { lightningProvider, nostrProvider } from "../pubkey/[...pubkey]";

export const authOptions: AuthOptions = {
  providers: [lightningProvider, nostrProvider],
};

export default NextAuth(authOptions);
