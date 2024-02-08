import { z } from "zod";

export const callbackQueryValidation = z.object({
  k1: z.string().min(1),
  key: z.string().min(1),
  sig: z.string().min(1),
});

export const callbackBodyValidation = z.preprocess(
  (results: any) => {
    if (results?.event) {
      return { event: JSON.parse(results.event) };
    } else {
      return {};
    }
  },
  z.object({
    event: z.object({
      kind: z.number(),
      created_at: z.number(),
      tags: z.array(z.array(z.string(), z.string())),
      content: z.string(),
      pubkey: z.string(),
      id: z.string(),
      sig: z.string(),
    }),
  })
);

export const createValidation = z
  .object({
    state: z.string().min(1),
    k1: z.string().min(1).optional(),
  })
  .strict();

export const signInValidation = z.object({
  state: z.string().min(1),
  redirect_uri: z.string().min(1),
});

export const pollValidation = z
  .object({
    k1: z.string().min(1),
  })
  .strict();

export const tokenValidation = z.object({
  grant_type: z.union([
    z.literal("authorization_code"),
    z.literal("refresh_token"),
  ]),
  code: z.string().optional(),
  refresh_token: z.string().optional(),
});
