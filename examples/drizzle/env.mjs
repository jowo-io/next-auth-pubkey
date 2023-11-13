import { z } from "zod";

/** @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>} */
const processEnv = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,

  DB_HOST: process.env.DB_HOST,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,

  NEXTAUTH_URL: process.env.NEXTAUTH_URL,

  LIGHTNING_CLIENT_ID: process.env.LIGHTNING_CLIENT_ID,
  LIGHTNING_CLIENT_SECRET: process.env.LIGHTNING_CLIENT_SECRET,

  NODE_ENV: process.env.NODE_ENV,
};

const client = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().min(1),

  NEXTAUTH_URL: z.string().min(1),

  NODE_ENV: z.enum(["development", "test", "production"]),
});

const server = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().min(1),

  DB_HOST: z.string(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  NEXTAUTH_URL: z.string().min(1),

  LIGHTNING_CLIENT_ID: z.string(),
  LIGHTNING_CLIENT_SECRET: z.string(),

  NODE_ENV: z.enum(["development", "test", "production"]),
});

// Don't touch the part below
// --------------------------

const merged = server.merge(client);

/** @typedef {z.input<typeof merged>} MergedInput */
/** @typedef {z.infer<typeof merged>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

let env = /** @type {MergedOutput} */ (process.env);

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === "undefined";

  const parsed = /** @type {MergedSafeParseReturn} */ (
    isServer
      ? merged.safeParse(processEnv) // on server we can validate all env vars
      : client.safeParse(processEnv) // on client we can only validate the ones that are exposed
  );

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_") && prop !== "NODE_ENV")
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`
        );
      return target[/** @type {keyof typeof target} */ (prop)];
    },
  });
}

export { env };
