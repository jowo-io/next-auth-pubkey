import { describe, expect, test } from "@jest/globals";
import { ZodObject } from "zod";

import {
  callbackQueryValidation,
  createValidation,
  signInValidation,
  pollValidation,
  tokenValidation,
} from "./api";

function parse(zod: ZodObject<any>, input: any) {
  try {
    zod.parse(input);
  } catch (e: any) {
    if (e?.issues) {
      return JSON.parse(JSON.stringify(e.issues));
    }
  }
  return [];
}

describe("callbackQueryValidation", () => {
  test("throws when empty", () => {
    const input = {};
    const expected: any = [
      {
        code: "invalid_type",
        expected: "string",
        message: "Required",
        path: ["k1"],
        received: "undefined",
      },
      {
        code: "invalid_type",
        expected: "string",
        message: "Required",
        path: ["key"],
        received: "undefined",
      },
      {
        code: "invalid_type",
        expected: "string",
        message: "Required",
        path: ["sig"],
        received: "undefined",
      },
    ];
    const output = parse(callbackQueryValidation, input);
    expect(output).toEqual(expected);
  });
  test("passes when valid", () => {
    const input = { k1: "k1", key: "key", sig: "sig" };
    const expected: any = [];
    const output = parse(callbackQueryValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when not strict", () => {
    const input = { k1: "k1", key: "key", sig: "sig", foo: "bar" };
    const expected: any = [];
    const output = parse(callbackQueryValidation, input);
    expect(output).toEqual(expected);
  });
});

describe("createValidation", () => {
  test("throws when empty", () => {
    const input = {};
    const expected: any = [
      {
        code: "invalid_type",
        expected: "string",
        message: "Required",
        path: ["state"],
        received: "undefined",
      },
    ];
    const output = parse(createValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when valid", () => {
    const input = { state: "state" };
    const expected: any = [];
    const output = parse(createValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when optional", () => {
    const input = { state: "state", k1: "k1" };
    const expected: any = [];
    const output = parse(createValidation, input);
    expect(output).toEqual(expected);
  });

  test("throws when strict", () => {
    const input = { state: "state", k1: "k1", foo: "bar" };
    const expected: any = [
      {
        code: "unrecognized_keys",
        keys: ["foo"],
        message: "Unrecognized key(s) in object: 'foo'",
        path: [],
      },
    ];
    const output = parse(createValidation, input);
    expect(output).toEqual(expected);
  });
});

describe("signInValidation", () => {
  test("throws when empty", () => {
    const input = {};
    const expected: any = [
      {
        code: "invalid_type",
        expected: "string",
        message: "Required",
        path: ["state"],
        received: "undefined",
      },
      {
        code: "invalid_type",
        expected: "string",
        message: "Required",
        path: ["redirect_uri"],
        received: "undefined",
      },
    ];
    const output = parse(signInValidation, input);
    expect(output).toEqual(expected);
  });
  test("passes when valid", () => {
    const input = { state: "state", redirect_uri: "redirect_uri" };
    const expected: any = [];
    const output = parse(signInValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when not strict", () => {
    const input = { state: "state", redirect_uri: "redirect_uri" };
    const expected: any = [];
    const output = parse(signInValidation, input);
    expect(output).toEqual(expected);
  });
});

describe("pollValidation", () => {
  test("throws when empty", () => {
    const input = {};
    const expected: any = [
      {
        code: "invalid_type",
        expected: "string",
        message: "Required",
        path: ["k1"],
        received: "undefined",
      },
    ];
    const output = parse(pollValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when valid", () => {
    const input = { k1: "k1" };
    const expected: any = [];
    const output = parse(pollValidation, input);
    expect(output).toEqual(expected);
  });

  test("throws when strict", () => {
    const input = { k1: "k1", foo: "bar" };
    const expected: any = [
      {
        code: "unrecognized_keys",
        keys: ["foo"],
        message: "Unrecognized key(s) in object: 'foo'",
        path: [],
      },
    ];
    const output = parse(pollValidation, input);
    expect(output).toEqual(expected);
  });
});

describe("tokenValidation", () => {
  test("throws when empty", () => {
    const input = {};
    const expected: any = [
      {
        code: "invalid_union",
        message: "Invalid input",
        path: ["grant_type"],
        unionErrors: [
          {
            issues: [
              {
                code: "invalid_literal",
                expected: "authorization_code",
                message: 'Invalid literal value, expected "authorization_code"',
                path: ["grant_type"],
              },
            ],
            name: "ZodError",
          },
          {
            issues: [
              {
                code: "invalid_literal",
                expected: "refresh_token",
                message: 'Invalid literal value, expected "refresh_token"',
                path: ["grant_type"],
              },
            ],
            name: "ZodError",
          },
        ],
      },
    ];
    const output = parse(tokenValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when valid auth code", () => {
    const input = { grant_type: "authorization_code", code: "code" };
    const expected: any = [];
    const output = parse(tokenValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when valid refresh token", () => {
    const input = {
      grant_type: "refresh_token",
      refresh_token: "refresh_token",
    };
    const expected: any = [];
    const output = parse(tokenValidation, input);
    expect(output).toEqual(expected);
  });

  test("passes when not strict", () => {
    const input = {
      grant_type: "authorization_code",
      code: "code",
      foo: "bar",
    };
    const expected: any = [];
    const output = parse(tokenValidation, input);
    expect(output).toEqual(expected);
  });
});
