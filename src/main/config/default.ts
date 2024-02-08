import merge from "lodash.merge";
import { z } from "zod";

import { Config, UserConfig, OptionalConfig, ThemeStyles } from "./types";
import { hardConfig } from "./hard";
import { configValidation } from "../validation/config";

export const colorSchemeLight: ThemeStyles = {
  background: "#ececec",
  backgroundCard: "#ffffff",
  text: "#000000",
  signInButtonBackground: "#24292f",
  signInButtonText: "#ffffff",
  qrBackground: "#ffffff",
  qrForeground: "#0d1117",
  qrMargin: 0,
};

export const colorSchemeDark: ThemeStyles = {
  background: "#161b22",
  backgroundCard: "#0d1117",
  text: "#ffffff",
  signInButtonBackground: "#24292f",
  signInButtonText: "#ffffff",
  qrBackground: "#ffffff",
  qrForeground: "#0d1117",
  qrMargin: 0.5,
};

export const defaultConfig: Partial<OptionalConfig> = {
  pages: {
    lightningSignIn: "/api/pubkey/lightning-signin", // default lightning auth page
    nostrSignIn: "/api/pubkey/nostr-signin", // default nostr auth page
    error: "/api/auth/error", // default next-auth error page
  },
  theme: {
    colorScheme: "light",
  },
  intervals: {
    poll: 1000, // milliseconds
    create: 5 * 60 * 1000, // milliseconds
  },
};

export function formatConfig(userConfig: UserConfig): Config {
  const theme =
    userConfig.theme?.colorScheme === "dark"
      ? colorSchemeDark
      : colorSchemeLight;

  const flags = {
    diagnostics: process?.env?.NODE_ENV === "development",
    logs: true,
  };

  configValidation.parse(userConfig, {
    errorMap: (issue) => {
      return { message: `Config option ${issue.path} of ${issue.code}` };
    },
  });

  const baseUrl = (
    /^((http|https):\/\/)/.test(userConfig.baseUrl)
      ? // return unmodified url if already prefixed with protocol
        userConfig.baseUrl
      : // append protocol prefix of https if missing
        `https://${userConfig.baseUrl}`
  ).replace(/\/$/, ""); // remove trailing slash if exists

  return merge(
    {}, // empty object to merge into
    defaultConfig,
    { theme, flags },
    userConfig,
    { baseUrl },
    hardConfig
  ) as Config;
}
