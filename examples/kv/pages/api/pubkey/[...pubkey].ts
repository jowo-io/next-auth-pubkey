import NextAuthPubkey, { NextAuthPubkeyConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";

import { kv } from "@vercel/kv";

import { env } from "@/env.mjs";

const config: NextAuthPubkeyConfig = {
  baseUrl: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  storage: {
    async set({ k1, data }) {
      await kv.set(`k1:${k1}`, data);
    },
    async get({ k1 }) {
      return await kv.get(`k1:${k1}`);
    },
    async update({ k1, data }) {
      const old = await kv.get(`k1:${k1}`);
      if (!old) throw new Error(`Could not find k1:${k1}`);
      await kv.set(`k1:${k1}`, { ...old, ...data });
    },
    async delete({ k1 }) {
      await kv.del(`k1:${k1}`);
    },
  },
  generateQr,
};

const { lightningProvider, nostrProvider, handler } = NextAuthPubkey(config);

export { lightningProvider, nostrProvider };

export default handler;
