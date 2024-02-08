import { describe, expect, test } from "@jest/globals";
import * as jwt from "../utils/jwt";

import handler from "./token";
import { Config, formatConfig } from "../config";
import merge from "lodash.merge";

const k1 = "k1";
const state = "state";
const pubkey = "0123456789";
const refreshToken = "refresh_token";
const idToken = "id_token";
const name = "cool-name";

const generateQr = jest.fn(async () => ({
  data: "qr-data",
  type: "svg" as "svg",
}));
const generateName = jest.fn(async () => ({
  name,
}));
const storage = {
  set: jest.fn(async () => undefined),
  get: jest.fn(async () => ({
    k1,
    success: true,
    state,
    pubkey,
  })),
  update: jest.fn(async () => undefined),
  delete: jest.fn(async () => undefined),
};

const requiredConfig = {
  baseUrl: "http://a.b",
  secret: "1234567890",
  storage,
  generateQr,
  generateName,
  generateAvatar: jest.fn(),
};

jest.mock("../utils/jwt", () => ({
  generateIdToken: jest.fn(async () => idToken),
  generateRefreshToken: jest.fn(async () => refreshToken),
  verifyRefreshToken: jest.fn(async () => ({ pubkey })),
}));

describe("token handler", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  let now: any;
  beforeAll(() => {
    now = Date.now;
    Date.now = jest.fn(() => 1700000000000);
  });
  afterAll(() => {
    Date.now = now;
  });

  describe("grant type code ", () => {
    test("throws without k1", async () => {
      const config = formatConfig({ ...requiredConfig }) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      const output = await handler({
        body: { grant_type: "authorization_code" },
        cookies: {},
        url,
        config,
      });
      expect(output).toEqual({
        error: "BadRequest",
        log: "The 'code' body argument is undefined",
      });
    });

    test("triggers get", async () => {
      const config = formatConfig({ ...requiredConfig }) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      await handler({
        body: { grant_type: "authorization_code", code: k1 },
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

    test("triggers get and throws", async () => {
      const config = formatConfig(
        merge({}, requiredConfig, {
          storage: {
            get: jest.fn(async () => {
              throw new Error("Foo bar");
            }),
          },
        })
      ) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      const output = await handler({
        body: { grant_type: "authorization_code", code: k1 },
        cookies: {},
        url,
        config,
      });
      expect(jest.mocked(config.storage.get)).toHaveBeenCalled();

      expect(output).toEqual({
        error: "Default",
        log: "Foo bar",
      });
    });

    test("unauthorized", async () => {
      const config = formatConfig(
        merge({}, requiredConfig, {
          storage: {
            get: jest.fn(async () => ({ success: false })),
          },
        })
      ) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      const output = await handler({
        body: { grant_type: "authorization_code", code: k1 },
        cookies: {},
        url,
        config,
      });
      expect(output).toEqual({
        error: "Unauthorized",
        log: "The 'success' boolean was undefined",
      });
    });

    test("missing pubkey", async () => {
      const config = formatConfig(
        merge({}, requiredConfig, {
          storage: {
            get: jest.fn(async () => ({ success: true })),
          },
        })
      ) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      const output = await handler({
        body: { grant_type: "authorization_code", code: k1 },
        cookies: {},
        url,
        config,
      });
      expect(output).toEqual({
        error: "Unauthorized",
        log: "The 'pubkey' was undefined",
      });
    });

    test("triggers delete", async () => {
      const config = formatConfig({ ...requiredConfig }) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      await handler({
        body: { grant_type: "authorization_code", code: k1 },
        cookies: {},
        url,
        config,
      });

      expect(jest.mocked(config.storage.delete)).toHaveBeenCalledWith(
        { k1 },
        url,
        config
      );
    });

    test("catches error if generateName throws", async () => {
      const config = formatConfig(
        merge({}, requiredConfig, {
          generateName: jest.fn(async () => {
            throw new Error("Foo bar");
          }),
        })
      ) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      const output = await handler({
        body: { grant_type: "authorization_code", code: k1 },
        cookies: {},
        url,
        config,
      });
      expect(output).toEqual({
        error: "Default",
        log: "Foo bar",
      });
    });

    test("returns response", async () => {
      const config = formatConfig({ ...requiredConfig }) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      const output = await handler({
        body: { grant_type: "authorization_code", code: k1 },
        cookies: {},
        url,
        config,
      });
      expect(output).toEqual({
        response: {
          expires_at: 1700014400,
          expires_in: 14400,
          id_token: idToken,
          refresh_token: refreshToken,
          scope: "user",
          success: true,
          token_type: "Bearer",
        },
      });
    });
  });

  describe("grant type token ", () => {
    test("throws without refreshToken", async () => {
      const config = formatConfig({ ...requiredConfig }) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      const output = await handler({
        body: { grant_type: "refresh_token" },
        cookies: {},
        url,
        config,
      });
      expect(output).toEqual({
        error: "BadRequest",
        log: "The 'refresh_token' body argument is undefined",
      });
    });

    test("triggers verifyRefreshToken", async () => {
      const config = formatConfig({ ...requiredConfig }) as Config;
      const url = new URL(`${requiredConfig.baseUrl}/api/pubkey/token`);
      await handler({
        body: { grant_type: "refresh_token", refresh_token: refreshToken },
        cookies: {},
        url,
        config,
      });
      expect(jest.mocked(jwt).verifyRefreshToken).toHaveBeenCalledWith(
        refreshToken,
        config
      );
    });
  });
});
