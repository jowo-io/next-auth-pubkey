import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

import { lightningProvider, nostrProvider } from "../pubkey/[...pubkey]";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [lightningProvider, nostrProvider],
  adapter: PrismaAdapter(prisma),
};

export default NextAuth(authOptions);
