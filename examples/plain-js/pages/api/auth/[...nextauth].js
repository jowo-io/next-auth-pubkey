import NextAuth from "next-auth";

import { lightningProvider, nostrProvider } from "../pubkey/[...pubkey].js";

export const authOptions = {
  providers: [lightningProvider, nostrProvider],
};

export default NextAuth(authOptions);
