import { describe, expect, test } from "@jest/globals";

import handler from "./create";
import { Config, formatConfig } from "../config";
import merge from "lodash.merge";

const oldK1 = "old-k1";
const newK1 = "new-k1";
const state = "state";
const lnurl =
  "LNURL1DP68GUP69UHKZTNZ9ASHQ6F0WP6KY6M90YHKXCTVD33XZCMT8A4NZ0TWV4MJ66E3YE6XZEEAD3HKW6TWFCLZZL";

jest.mock("crypto", () => ({
  randomBytes: jest.fn(() => ({ toString: jest.fn(() => newK1) })),
}));

const generateQr = jest.fn(async () => ({
  data: "qr-data",
  type: "svg" as "svg",
}));
const storage = {
  set: jest.fn(async () => undefined),
  get: jest.fn(async () => ({
    k1: newK1,
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

describe("create handler", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  test("doesn't calls delete if no old k1 is provided", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/create`);
    await handler({
      body: { state },
      cookies: {},
      url,
      config,
    });
    expect(jest.mocked(config.storage.delete)).not.toHaveBeenCalled();
  });

  test("calls delete with old k1", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/create`);
    await handler({
      body: { state, k1: oldK1 },
      cookies: {},
      url,
      config,
    });
    expect(jest.mocked(config.storage.delete)).toHaveBeenCalledWith(
      { k1: oldK1 },
      url,
      config
    );
  });

  test("doesn't throw when delete fails", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          delete: jest.fn(async () => {
            throw new Error("Foo bar");
          }),
        },
        intervals: {
          poll: 500,
          create: 300000,
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/create`);
    const output = await handler({
      body: { state, k1: oldK1 },
      cookies: {},
      url,
      config,
    });
    const expected = {
      response: {
        k1: newK1,
        lnurl,
        success: true,
        pollInterval: 500,
        createInterval: 300000,
      },
    };
    expect(output).toEqual(expected);
  });

  test("calls set with new k1", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/create`);
    await handler({
      body: { state },
      cookies: {},
      url,
      config,
    });
    expect(jest.mocked(config.storage.set)).toHaveBeenCalledWith(
      { k1: newK1, data: { k1: newK1, state } },
      url,
      config
    );
  });

  test("throws when set fails", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        storage: {
          set: jest.fn(async () => {
            throw new Error("Foo bar");
          }),
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/create`);
    const output = await handler({
      body: {
        state,
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

  test("returns formatted lnurl", async () => {
    const config = formatConfig(
      merge({}, requiredConfig, {
        intervals: {
          poll: 500,
          create: 300000,
        },
      })
    ) as Config;
    const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/create`);
    const output = await handler({
      body: { state },
      cookies: {},
      url,
      config,
    });
    const expected = {
      response: {
        k1: newK1,
        lnurl,
        success: true,
        pollInterval: 500,
        createInterval: 300000,
      },
    };
    expect(output).toEqual(expected);
  });
});
