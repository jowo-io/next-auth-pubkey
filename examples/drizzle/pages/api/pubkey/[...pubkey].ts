import NextAuthLightning, { NextAuthLightningConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";

import { eq } from "drizzle-orm";

import { pubkeyTable, PubKey } from "@/schema/db";
import db from "@/utils/db";
import { env } from "@/env.mjs";

const config: NextAuthLightningConfig = {
  // required
  baseUrl: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  storage: {
    async set({ k1, session }) {
      await db.insert(pubkeyTable).values(session);
    },
    async get({ k1 }) {
      const results: PubKey[] = await db
        .select()
        .from(pubkeyTable)
        .where(eq(pubkeyTable.k1, k1));

      return results[0];
    },
    async update({ k1, session }) {
      const results = await db
        .update(pubkeyTable)
        .set(session)
        .where(eq(pubkeyTable.k1, k1));
      if (!results[0].affectedRows) throw new Error(`Could not find k1:${k1}`);
    },
    async delete({ k1 }) {
      await db.delete(pubkeyTable).where(eq(pubkeyTable.k1, k1));
    },
  },
  generateQr,

  // optional
  theme: {
    colorScheme: "dark",
  },
};

const { lightningProvider, nostrProvider, handler } = NextAuthLightning(config);

export { lightningProvider, nostrProvider };

export default handler;
