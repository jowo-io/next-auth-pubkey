import { describe, expect, test } from "@jest/globals";
import * as jose from "jose";

import {
  generateIdToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./jwt";
import { Config } from "../config";

const pubkey = "0123456789";

const config = {
  baseUrl: "http://a.b",
  secret: "secret",
  intervals: {
    refreshToken: 99999999,
    idToken: 99999999,
  },
} as Config;
const secret = Buffer.from(config.secret);

describe("jwt", () => {
  let now: any;
  beforeAll(() => {
    now = Date.now;
    Date.now = jest.fn(() => 1700000000000);
  });
  afterAll(() => {
    Date.now = now;
  });

  describe("generateIdToken", () => {
    test("returns a valid id token with pubkey", async () => {
      const output = await generateIdToken(pubkey, "", "", config);
      const decoded = await jose.jwtVerify(output, secret);
      const expected = {
        payload: {
          aud: "http://a.b",
          exp: 1799999999,
          iat: 1700000000,
          id: "0123456789",
          image: "",
          iss: "http://a.b",
          name: "",
          sub: "0123456789",
        },
        protectedHeader: {
          alg: "HS256",
        },
      };
      expect(decoded).toEqual(expected);
    });

    test("returns a valid id token with pubkey and name", async () => {
      const output = await generateIdToken(pubkey, "foo-bar", "", config);
      const decoded = await jose.jwtVerify(output, secret);
      const expected = {
        payload: {
          aud: "http://a.b",
          exp: 1799999999,
          iat: 1700000000,
          id: "0123456789",
          image: "",
          iss: "http://a.b",
          name: "foo-bar",
          sub: "0123456789",
        },
        protectedHeader: {
          alg: "HS256",
        },
      };
      expect(decoded).toEqual(expected);
    });

    test("returns a valid id token with pubkey, name and image", async () => {
      const output = await generateIdToken(
        pubkey,
        "foo-bar",
        `${config.baseUrl}/api/pubkey/avatar/${pubkey}`,
        config
      );
      const decoded = await jose.jwtVerify(output, secret);
      const expected = {
        payload: {
          aud: "http://a.b",
          exp: 1799999999,
          iat: 1700000000,
          id: "0123456789",
          image: `${config.baseUrl}/api/pubkey/avatar/${pubkey}`,
          iss: "http://a.b",
          name: "foo-bar",
          sub: "0123456789",
        },
        protectedHeader: {
          alg: "HS256",
        },
      };
      expect(decoded).toEqual(expected);
    });
  });

  describe("generateRefreshToken", () => {
    test("returns a valid refresh token with pubkey", async () => {
      const output = await generateRefreshToken(pubkey, config);
      const decoded = await jose.jwtVerify(output, secret);
      const expected = {
        payload: {
          aud: "http://a.b",
          exp: 1799999999,
          iat: 1700000000,
          id: "0123456789",
          iss: "http://a.b",
          sub: "0123456789",
        },
        protectedHeader: {
          alg: "HS256",
        },
      };
      expect(decoded).toEqual(expected);
    });
  });

  describe("verifyRefreshToken", () => {
    test("returns a valid jwt with pubkey", async () => {
      const token = await generateRefreshToken(pubkey, config);
      const output = await verifyRefreshToken(token, config);
      const expected = {
        jwt: {
          aud: "http://a.b",
          exp: 1799999999,
          iat: 1700000000,
          id: "0123456789",
          iss: "http://a.b",
          sub: "0123456789",
        },
        pubkey: "0123456789",
      };
      expect(output).toEqual(expected);
    });
  });
});
