import { describe, expect, test } from "@jest/globals";

import handler from "./callback";
import { Config, formatConfig } from "../config";
import merge from "lodash.merge";

const generateQr = jest.fn(async () => ({
  data: "qr-data",
  type: "svg" as "svg",
}));
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

const validK1 =
  "7c0b2c5b41afe4da74949214fb67586dca8502e32d8a7e3ca136fdb26b009b33";
const invalidK1 =
  "7c0b2c5b41afe4da74949214fb67586dda8502e32d8a7e3ca136fdb26b009b33";
const pubkey =
  "03b4e4caca82b8198ff4e5a6774c334f896fb8df5a38068ec3b4206b7f06d320d4";
const sig =
  "3045022100c888791a4025396d822c06fa72756364b9aea4fd864889f3203a52c3342545eb022005d7acefee963101985b3f898a084323a179bf98a226f5f39f6823bc31d16a55";

describe("callback handler", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  test("throws when k1 is invalid", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const output = await handler({
      query: { k1: "invalid-k1", key: pubkey, sig },
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/callback`),
      config,
    });
    const expected = {
      error: "Unauthorized",
      log: 'Invalid argument ("k1"): Hex-encoded string or buffer expected.',
    };
    expect(output).toEqual(expected);
  });

  test("throws when k1 doesn't match sig and pubkey'", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const output = await handler({
      query: {
        k1: invalidK1,
        key: pubkey,
        sig,
      },
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/callback`),
      config,
    });
    const expected = {
      error: "Unauthorized",
      log: "Invalid signature",
    };
    expect(output).toEqual(expected);
  });

  test("doesn't throw when delete fails", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          delete: jest.fn(async () => {
            throw new Error("Foo bar");
          }),
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/callback`);
    const output = await handler({
      query: {
        k1: validK1,
        key: pubkey,
        sig,
      },
      cookies: {},
      url,
      config,
    });
    const expected = {
      response: {
        k1: validK1,
        status: "OK",
        success: true,
      },
    };
    expect(output).toEqual(expected);
  });

  test("passes when k1 matches sig and pubkey'", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const output = await handler({
      query: {
        k1: validK1,
        key: pubkey,
        sig,
      },
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/callback`),
      config,
    });
    const expected = {
      response: {
        k1: validK1,
        status: "OK",
        success: true,
      },
    };
    expect(output).toEqual(expected);
  });

  test("calls delete with k1 when authorized", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/callback`);
    await handler({
      query: {
        k1: validK1,
        key: pubkey,
        sig,
      },
      cookies: {},
      url,
      config,
    });
    expect(jest.mocked(config.storage.update)).toHaveBeenCalledWith(
      { k1: validK1, session: { pubkey, sig, success: true } },
      url,
      config
    );
  });

  test("throws when delete fails", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          update: jest.fn(async () => {
            throw new Error("Foo bar");
          }),
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/callback`);
    const output = await handler({
      query: {
        k1: validK1,
        key: pubkey,
        sig,
      },
      cookies: {},
      url,
      config,
    });
    const expected = {
      error: "Default",
      log: "Foo bar",
    };
    expect(output).toEqual(expected);
  });
});
