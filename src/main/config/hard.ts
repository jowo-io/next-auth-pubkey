import { HardConfig } from "./types";

const idPrefix = "next-auth-pubkey-provider";

export const hardConfig: HardConfig = {
  apis: {
    // apis
    create: "/api/lnauth/create",
    poll: "/api/lnauth/poll",
    callback: "/api/lnauth/callback",
    token: "/api/lnauth/token",

    // pages
    lightningSignIn: "/api/lnauth/lightning-signin",
    nostrSignIn: "/api/lnauth/nostr-signin",

    // misc
    avatar: "/api/lnauth/avatar",
    qr: "/api/lnauth/qr",
    diagnostics: "/api/lnauth/diagnostics",
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
