import { z } from "zod";

const leadingSlashRegex = new RegExp("^(/+)");

export const configValidation = z
  .object({
    // required
    baseUrl: z.string().min(5),
    secret: z.string().min(10),
    storage: z
      .object({
        set: z.function(),
        get: z.function(),
        update: z.function(),
        delete: z.function(),
      })
      .strict(),
    generateQr: z.function(),

    // optional
    generateAvatar: z.function().optional(),
    generateName: z.function().optional(),
    pages: z
      .object({
        signIn: z.string().regex(leadingSlashRegex).min(1).optional(),
        error: z.string().regex(leadingSlashRegex).min(1).optional(),
      })
      .strict()
      .nullish(),
    flags: z
      .object({
        diagnostics: z.boolean().optional(),
        logs: z.boolean().optional(),
      })
      .strict()
      .nullish(),
    theme: z
      .object({
        colorScheme: z
          .union([z.literal("light"), z.literal("dark")])
          .optional(),
        background: z.string().min(1).optional(),
        backgroundCard: z.string().min(1).optional(),
        text: z.string().min(1).optional(),
        error: z.string().min(1).optional(),
        signInButtonBackground: z.string().min(1).optional(),
        signInButtonText: z.string().min(1).optional(),
        qrBackground: z.string().min(1).optional(),
        qrForeground: z.string().min(1).optional(),
        qrMargin: z.number().positive().max(10).optional(),
      })
      .strict()
      .nullish(),
    intervals: z
      .object({
        poll: z
          .number()
          .min(500) // 0.5s
          .max(5000) // 5s
          .optional(),
        create: z
          .number()
          .min(30 * 1000) // 30s
          .max(60 * 60 * 1000) // 1h
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
