import NextAuthPubkey, { NextAuthPubkeyConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";

import { eq } from "drizzle-orm";

import { pubkeyTable, PubKey } from "@/schema/db";
import db from "@/utils/db";
import { env } from "@/env.mjs";

const config: NextAuthPubkeyConfig = {
  baseUrl: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  storage: {
    async set({ data }) {
      await db.insert(pubkeyTable).values(data);
    },
    async get({ k1 }) {
      const results: PubKey[] = await db
        .select()
        .from(pubkeyTable)
        .where(eq(pubkeyTable.k1, k1));

      return results[0];
    },
    async update({ k1, data }) {
      const results = await db
        .update(pubkeyTable)
        .set(data)
        .where(eq(pubkeyTable.k1, k1));
      if (!results[0].affectedRows) throw new Error(`Could not find k1:${k1}`);
    },
    async delete({ k1 }) {
      await db.delete(pubkeyTable).where(eq(pubkeyTable.k1, k1));
    },
  },
  generateQr,
};

const { lightningProvider, nostrProvider, handler } = NextAuthPubkey(config);

export { lightningProvider, nostrProvider };

export default handler;
