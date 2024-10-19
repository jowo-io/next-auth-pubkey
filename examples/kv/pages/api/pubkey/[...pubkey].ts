import NextAuthLightning, { NextAuthLightningConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";

import { kv } from "@vercel/kv";

import { env } from "@/env.mjs";

const config: NextAuthLightningConfig = {
  // required
  baseUrl: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  storage: {
    async set({ k1, session }) {
      await kv.set(`k1:${k1}`, session);
    },
    async get({ k1 }) {
      return await kv.get(`k1:${k1}`);
    },
    async update({ k1, session }) {
      const old = await kv.get(`k1:${k1}`);
      if (!old) throw new Error(`Could not find k1:${k1}`);
      await kv.set(`k1:${k1}`, { ...old, ...session });
    },
    async delete({ k1 }) {
      await kv.del(`k1:${k1}`);
    },
  },
  generateQr,
};

const { lightningProvider, nostrProvider, handler } = NextAuthLightning(config);

export { lightningProvider, nostrProvider };

export default handler;
