import { HardConfig } from "./types";

const idPrefix = "next-auth-pubkey-provider";

export const hardConfig: HardConfig = {
  apis: {
    // apis
    create: "/api/pubkey/create",
    poll: "/api/pubkey/poll",
    callback: "/api/pubkey/callback",
    token: "/api/pubkey/token",

    // pages
    lightningSignIn: "/api/pubkey/lightning-signin",
    nostrSignIn: "/api/pubkey/nostr-signin",

    // misc
    avatar: "/api/pubkey/avatar",
    qr: "/api/pubkey/qr",
    diagnostics: "/api/pubkey/diagnostics",
  },
  ids: {
    title: `${idPrefix}---title`,
    qr: `${idPrefix}---qr`,
    copy: `${idPrefix}---copy`,
    button: `${idPrefix}---button`,
    loading: `${idPrefix}---loading`,
    wrapper: `${idPrefix}---wrapper`,
    error: `${idPrefix}---error`,
    details: `${idPrefix}---details`,
  },
  intervals: {
    refreshToken: 30 * 24 * 60 * 60, // seconds
    idToken: 4 * 60 * 60, // seconds
  },
};
