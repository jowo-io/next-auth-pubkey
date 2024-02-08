import NextAuthLightning, {
  NextAuthLightningConfig,
} from "next-auth-pubkey-provider";
import generateQr from "next-auth-pubkey-provider/generators/qr";
import generateName from "next-auth-pubkey-provider/generators/name";
import generateAvatar from "next-auth-pubkey-provider/generators/avatar";

import { eq } from "drizzle-orm";

import { lnAuthTable, LnAuth } from "@/schema/db";
import db from "@/utils/db";
import { env } from "@/env.mjs";

const config: NextAuthLightningConfig = {
  // required
  baseUrl: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  storage: {
    async set({ k1, session }) {
      await db.insert(lnAuthTable).values(session);
    },
    async get({ k1 }) {
      const results: LnAuth[] = await db
        .select()
        .from(lnAuthTable)
        .where(eq(lnAuthTable.k1, k1));

      return results[0];
    },
    async update({ k1, session }) {
      const results = await db
        .update(lnAuthTable)
        .set(session)
        .where(eq(lnAuthTable.k1, k1));
      if (!results[0].affectedRows) throw new Error(`Could not find k1:${k1}`);
    },
    async delete({ k1 }) {
      await db.delete(lnAuthTable).where(eq(lnAuthTable.k1, k1));
    },
  },
  generateQr,

  // optional
  generateName,
  generateAvatar,
  theme: {
    colorScheme: "dark",
  },
};

const { lightningProvider, nostrProvider, handler } = NextAuthLightning(config);

export { lightningProvider, nostrProvider };

export default handler;
