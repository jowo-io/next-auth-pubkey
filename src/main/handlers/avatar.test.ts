import { describe, expect, test } from "@jest/globals";

import handler from "./avatar";
import { Config, formatConfig } from "../config";

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

const pubkey = "0123456789";

describe("avatar handler", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  test("missing pubkey from url", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const output = await handler({
      query: {},
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/`),
      config,
    });
    const expected = { error: "NotFound", status: 404 };
    expect(output).toEqual(expected);
  });

  test("missing generateAvatar method in config", async () => {
    const config = formatConfig({
      ...requiredConfig,
    }) as Config;
    const output = await handler({
      query: {},
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/avatar/${pubkey}`),
      config,
    });
    const expected = {
      error: "Default",
      log: "The generateAvatar method is not defined.",
    };
    expect(output).toEqual(expected);
  });

  test("throw generateAvatar method", async () => {
    const config = formatConfig({
      ...requiredConfig,
      generateAvatar: jest.fn(async () => {
        throw new Error("Foo bar");
      }),
    }) as Config;
    const output = await handler({
      query: {},
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/avatar/${pubkey}`),
      config,
    });
    const expected = {
      error: "Default",
      log: "Foo bar",
    };
    expect(output).toEqual(expected);
  });

  test("invalid file type returned from generateAvatar method", async () => {
    const config = formatConfig({
      ...requiredConfig,
      // @ts-ignore
      generateAvatar: jest.fn(async () => ({
        data: "avatar-data",
        type: "webp",
      })),
    }) as Config;
    const output = await handler({
      query: {},
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/avatar/${pubkey}`),
      config,
    });
    const expected = {
      error: "Default",
      log: "Invalid 'type' property returned from the generateAvatar method, expected png,jpg,svg, received webp.",
    };
    expect(output).toEqual(expected);
  });

  test("invalid file data returned from generateAvatar method", async () => {
    const config = formatConfig({
      ...requiredConfig,
      // @ts-ignore
      generateAvatar: jest.fn(async () => ({
        data: "",
        type: "svg",
      })),
    }) as Config;
    const output = await handler({
      query: {},
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/avatar/${pubkey}`),
      config,
    });
    const expected = {
      error: "Default",
      log: "Invalid 'data' property returned from the generateAvatar method.",
    };
    expect(output).toEqual(expected);
  });

  test("svg returned from generateAvatar method", async () => {
    const config = formatConfig({
      ...requiredConfig,
      generateAvatar: jest.fn(async () => ({
        data: "<svg>.....</svg>",
        type: "svg" as "svg",
      })),
    }) as Config;
    const output = await handler({
      query: {},
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/avatar/${pubkey}`),
      config,
    });
    const expected = {
      headers: {
        "cache-control": "public, max-age=86400",
        "content-type": "image/svg+xml",
      },
      response: "<svg>.....</svg>",
    };
    expect(output).toEqual(expected);
  });

  test("base64 returned from generateAvatar method", async () => {
    const config = formatConfig({
      ...requiredConfig,
      generateAvatar: jest.fn(async () => ({
        data: "data:image/png;base64,iVBO.....CYII=",
        type: "png" as "png",
      })),
    }) as Config;
    const output = await handler({
      query: {},
      cookies: {},
      url: new URL(`${requiredConfig.baseUrl}/api/pubkey/avatar/${pubkey}`),
      config,
    });
    const expected = {
      headers: {
        "cache-control": "public, max-age=86400",
        "content-length": "14",
        "content-type": "image/png",
      },
      response: Buffer.from("iVBO.....CYII=", "base64"),
    };
    expect(output).toEqual(expected);
  });
});
