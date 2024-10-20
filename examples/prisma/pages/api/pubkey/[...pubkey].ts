import NextAuthPubkey, { NextAuthPubkeyConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";

import { PrismaClient } from "@prisma/client";

import { env } from "@/env.mjs";

const prisma = new PrismaClient();

const config: NextAuthPubkeyConfig = {
  baseUrl: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  storage: {
    async set({ session }) {
      await prisma.pubkey.create({
        data: session,
      });
    },
    async get({ k1 }) {
      const results = await prisma.pubkey.findUnique({
        where: { k1 },
      });
      if (!results) throw new Error(`Could not find k1:${k1}`);
      return results;
    },
    async update({ k1, session }) {
      await prisma.pubkey.update({
        where: { k1 },
        data: session,
      });
    },
    async delete({ k1 }) {
      await prisma.pubkey.delete({
        where: { k1 },
      });
    },
  },
  generateQr,
};

const { lightningProvider, nostrProvider, handler } = NextAuthPubkey(config);

export { lightningProvider, nostrProvider };

export default handler;
