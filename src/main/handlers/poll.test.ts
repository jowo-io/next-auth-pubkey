import { describe, expect, test } from "@jest/globals";

import handler from "./poll";
import { Config, formatConfig } from "../config";
import merge from "lodash.merge";

const k1 = "k1";
const state = "state";

jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({ toString: jest.fn(() => k1) })),
}));

const generateQr = jest.fn(async () => ({
  data: "qr-data",
  type: "svg" as "svg",
}));
const storage = {
  set: jest.fn(async () => undefined),
  get: jest.fn(async () => ({
    k1,
    state,
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

describe("poll handler", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  test("calls get with k1", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/poll`);
    await handler({
      body: { k1 },
      cookies: {},
      url,
      config,
    });
    expect(jest.mocked(config.storage.get)).toHaveBeenCalledWith(
      { k1 },
      url,
      config
    );
  });

  test("throws when get fails", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          get: jest.fn(async () => {
            throw new Error("Foo bar");
          }),
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/poll`);
    const output = await handler({
      body: { k1 },
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

  test("returns Gone status when get returns null", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          get: jest.fn(async () => null),
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/poll`);
    const output = await handler({
      body: { k1 },
      cookies: {},
      url,
      config,
    });
    const expected = {
      error: "Gone",
      status: 410,
    };
    expect(output).toEqual(expected);
  });

  test("returns false if success is undefined", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          get: jest.fn(async () => ({ k1, state })),
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/poll`);
    const output = await handler({
      body: { k1 },
      cookies: {},
      url,
      config,
    });
    const expected = {
      response: {
        success: false,
      },
    };
    expect(output).toEqual(expected);
  });

  test("returns success", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          get: jest.fn(async () => ({ k1, state, success: true })),
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/poll`);
    const output = await handler({
      body: { k1 },
      cookies: {},
      url,
      config,
    });
    const expected = {
      response: {
        success: true,
      },
    };
    expect(output).toEqual(expected);
  });
});
