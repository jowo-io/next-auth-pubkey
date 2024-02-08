import { describe, expect, test } from "@jest/globals";
import merge from "lodash.merge";

import {
  colorSchemeDark,
  colorSchemeLight,
  defaultConfig,
  formatConfig,
} from "./default";
import { hardConfig } from "./hard";
import { UserConfig } from "./types";

const generateQr = jest.fn(async () => ({
  data: "qr-data",
  type: "svg" as "svg",
}));
const generateAvatar = jest.fn(async () => ({
  data: "avatar-data",
  type: "svg" as "svg",
}));
const generateName = jest.fn(async () => ({ name: "name" }));
const storage = {
  set: jest.fn(async () => undefined),
  get: jest.fn(async () => ({
    k1: "k1",
    state: "state",
    sig: "sig",
    pubkey: "pubkey",
    success: true,
  })),
  update: jest.fn(async () => undefined),
  delete: jest.fn(async () => undefined),
};

const requiredConfig = {
  baseUrl: "http://a.b",
  secret: "1234567890",
  storage,
  generateQr,
};

describe("formatConfig", () => {
  test("returns all user config options as expected", () => {
    const userConfig = merge({}, requiredConfig, {
      generateAvatar,
      generateName,
      pages: {
        lightningSignIn: "/lightning-signin",
        nostrSignIn: "/nostr-signin",
        error: "/error",
      },
      flags: {
        diagnostics: true,
        logs: true,
      },
      theme: {
        colorScheme: "dark",
        background: "#f0f",
        backgroundCard: "#f0f",
        text: "#f0f",
        qrBackground: "#f0f",
        qrForeground: "#f0f",
        qrMargin: 5,
        signInButtonBackground: "#f0f",
        signInButtonText: "#f0f",
      },
      intervals: {
        poll: 500,
        create: 300000,
      },
    }) as UserConfig;
    const output = formatConfig(userConfig);
    const expected = merge(
      {},
      requiredConfig,
      {
        generateAvatar,
        generateName,
        pages: {
          lightningSignIn: "/lightning-signin",
          nostrSignIn: "/nostr-signin",
          error: "/error",
        },
        flags: {
          diagnostics: true,
          logs: true,
        },
        theme: {
          colorScheme: "dark",
          background: "#f0f",
          backgroundCard: "#f0f",
          text: "#f0f",
          qrBackground: "#f0f",
          qrForeground: "#f0f",
          qrMargin: 5,
          signInButtonBackground: "#f0f",
          signInButtonText: "#f0f",
        },
        intervals: {
          poll: 500,
          create: 300000,
        },
      },
      hardConfig
    );
    expect(output).toEqual(expected);
  });

  test("returns all the correct default config options", () => {
    const userConfig = merge({}, requiredConfig, {}) as UserConfig;
    const output = formatConfig(userConfig);
    const expected = merge(
      {},
      defaultConfig,
      requiredConfig,
      {
        theme: colorSchemeLight,
        flags: {
          diagnostics: false,
          logs: true,
        },
      },
      hardConfig
    );
    expect(output).toEqual(expected);
  });
});

describe("baseUrl", () => {
  test("returns unchanged baseUrl value", () => {
    const userConfig = merge({}, requiredConfig, {
      baseUrl: "https://foo.bar",
    }) as UserConfig;
    const { baseUrl } = formatConfig(userConfig);
    const expected = "https://foo.bar";
    expect(baseUrl).toEqual(expected);
  });

  test("returns baseUrl with prefixed protocol", () => {
    const userConfig = merge({}, requiredConfig, {
      baseUrl: "foo.bar",
    }) as UserConfig;
    const { baseUrl } = formatConfig(userConfig);
    const expected = "https://foo.bar";
    expect(baseUrl).toEqual(expected);
  });

  test("returns baseUrl without trailing slash", () => {
    const userConfig = merge({}, requiredConfig, {
      baseUrl: "https://foo.bar/",
    }) as UserConfig;
    const { baseUrl } = formatConfig(userConfig);
    const expected = "https://foo.bar";
    expect(baseUrl).toEqual(expected);
  });

  test("returns baseUrl with prefixed protocol and without trailing slash", () => {
    const userConfig = merge({}, requiredConfig, {
      baseUrl: "foo.bar/",
    }) as UserConfig;
    const { baseUrl } = formatConfig(userConfig);
    const expected = "https://foo.bar";
    expect(baseUrl).toEqual(expected);
  });
});

describe("theme", () => {
  test("returns correct default color scheme", () => {
    const userConfig = merge({}, requiredConfig, {}) as UserConfig;
    const output = formatConfig(userConfig);
    const expected = merge({}, { colorScheme: "light" }, colorSchemeLight);
    expect(output.theme).toEqual(expected);
  });

  test("returns correct theme colors when theme is set to light", () => {
    const userConfig = merge({}, requiredConfig, {
      theme: { colorScheme: "light" },
    }) as UserConfig;
    const output = formatConfig(userConfig);
    const expected = merge({}, { colorScheme: "light" }, colorSchemeLight);
    expect(output.theme).toEqual(expected);
  });

  test("returns correct theme colors when theme is set to dark", () => {
    const userConfig = merge({}, requiredConfig, {
      theme: { colorScheme: "dark" },
    }) as UserConfig;
    const { theme } = formatConfig(userConfig);
    const expected = merge({}, { colorScheme: "dark" }, colorSchemeDark);
    expect(theme).toEqual(expected);
  });
});

describe("flags", () => {
  test("returns correct default flags", () => {
    const userConfig = merge({}, requiredConfig, {}) as UserConfig;
    const { flags } = formatConfig(userConfig);
    const expected = { diagnostics: false, logs: true };
    expect(flags).toEqual(expected);
  });

  test("returns correct flag when true", () => {
    const userConfig = merge({}, requiredConfig, {
      flags: { diagnostics: true, logs: true },
    }) as UserConfig;
    const { flags } = formatConfig(userConfig);
    const expected = { diagnostics: true, logs: true };
    expect(flags).toEqual(expected);
  });

  test("returns correct flag when false", () => {
    const userConfig = merge({}, requiredConfig, {
      flags: { diagnostics: false, logs: false },
    }) as UserConfig;
    const { flags } = formatConfig(userConfig);
    const expected = { diagnostics: false, logs: false };
    expect(flags).toEqual(expected);
  });
});
