import NextAuthLightning, {
  NextAuthLightningConfig,
} from "next-auth-lightning-provider";
import generateQr from "next-auth-lightning-provider/generators/qr";
import generateName from "next-auth-lightning-provider/generators/name";
import generateAvatar from "next-auth-lightning-provider/generators/avatar";

import { env } from "@/env.mjs";

import storage from "node-persist"; // ⚠️ WARNING using node-persist is not recommended in lambda or edge environments.

await storage.init();

const config: NextAuthLightningConfig = {
  // required
  baseUrl: env.NEXTAUTH_URL,
  secret: env.NEXTAUTH_SECRET,
  storage: {
    async set({ k1, session }) {
      await storage.setItem(`k1:${k1}`, session);
    },
    async get({ k1 }) {
      return await storage.getItem(`k1:${k1}`);
    },
    async update({ k1, session }) {
      const old = await storage.getItem(`k1:${k1}`);
      if (!old) throw new Error(`Could not find k1:${k1}`);
      await storage.updateItem(`k1:${k1}`, { ...old, ...session });
    },
    async delete({ k1 }) {
      await storage.removeItem(`k1:${k1}`);
    },
  },
  generateQr,

  // optional
  generateName,
  generateAvatar,
  pages: {
    lightningSignIn: "/lightning-signin",
    nostrSignIn: "/nostr-signin",
    error: "/error",
  },
  theme: {
    colorScheme: "dark",
  },
};

const { lightningProvider, nostrProvider, handler } = NextAuthLightning(config);

export { lightningProvider, nostrProvider };

export default handler;
