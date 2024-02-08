import { describe, expect, test } from "@jest/globals";
import { ZodObject } from "zod";
import merge from "lodash.merge";

import { configValidation } from "./config";

const requiredConfig = {
  baseUrl: "http://a.b",
  secret: "1234567890",
  storage: {
    set: async () => undefined,
    get: async () => ({
      k1: "k1",
      state: "state",
      sig: "sig",
      pubkey: "pubkey",
      success: true,
    }),
    update: async () => undefined,
    delete: async () => undefined,
  },
  generateQr: async () => ({ data: "qr-data", type: "svg" as "svg" }),
};

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

describe("empty", () => {
  test("throws when empty user config is provided", () => {
    const userConfig = {};
    const expected: any = [
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["baseUrl"],
        message: "Required",
      },
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["secret"],
        message: "Required",
      },
      {
        code: "invalid_type",
        expected: "object",
        received: "undefined",
        path: ["storage"],
        message: "Required",
      },
      {
        code: "invalid_type",
        expected: "function",
        received: "undefined",
        path: ["generateQr"],
        message: "Required",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });
});

describe("unknown keys", () => {
  test("throws when empty user config is provided", () => {
    const userConfig = merge({}, requiredConfig, {
      random: "key",
      foo: "bar",
      abc: 123,
      hello: { world: "planet" },
    });
    const expected: any = [
      {
        code: "unrecognized_keys",
        keys: ["random", "foo", "abc", "hello"],
        path: [],
        message:
          "Unrecognized key(s) in object: 'random', 'foo', 'abc', 'hello'",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });
});

describe("baseUrl", () => {
  test("throws when baseUrl is missing", () => {
    const userConfig = merge({}, requiredConfig, {});
    // @ts-ignore
    delete userConfig.baseUrl;
    const expected: any = [
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["baseUrl"],
        message: "Required",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when baseUrl is empty string", () => {
    const userConfig = merge({}, requiredConfig, {
      baseUrl: "",
    });
    const expected: any = [
      {
        code: "too_small",
        minimum: 5,
        type: "string",
        inclusive: true,
        exact: false,
        message: "String must contain at least 5 character(s)",
        path: ["baseUrl"],
      },
    ];

    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when baseUrl is too short", () => {
    const userConfig = merge({}, requiredConfig, {
      baseUrl: "a.b",
    });
    const expected: any = [
      {
        code: "too_small",
        minimum: 5,
        type: "string",
        inclusive: true,
        exact: false,
        message: "String must contain at least 5 character(s)",
        path: ["baseUrl"],
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("passes when baseUrl is longer than 4 characters", () => {
    const userConfig = merge({}, requiredConfig, {
      baseUrl: "ab.cd",
    });
    const expected: any = [];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });
});

describe("secret", () => {
  test("throws when secret is missing", () => {
    const userConfig = merge({}, requiredConfig, {});
    //@ts-ignore
    delete userConfig.secret;
    const expected: any = [
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["secret"],
        message: "Required",
      },
    ];

    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when secret is empty string", () => {
    const userConfig = merge({}, requiredConfig, {
      secret: "",
    });
    const expected: any = [
      {
        code: "too_small",
        minimum: 10,
        type: "string",
        inclusive: true,
        exact: false,
        message: "String must contain at least 10 character(s)",
        path: ["secret"],
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when secret is too short", () => {
    const userConfig = merge({}, requiredConfig, {
      secret: "12345",
    });
    const expected: any = [
      {
        code: "too_small",
        minimum: 10,
        type: "string",
        inclusive: true,
        exact: false,
        message: "String must contain at least 10 character(s)",
        path: ["secret"],
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("passes when secret is longer than 10 characters", () => {
    const userConfig = merge({}, requiredConfig, {
      secret: "1234567890",
    });
    const expected: any = [];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });
});

describe("storage", () => {
  test("throws when storage is missing", () => {
    const userConfig = merge({}, requiredConfig, {});
    //@ts-ignore
    delete userConfig.storage;
    const expected: any = [
      {
        code: "invalid_type",
        expected: "object",
        received: "undefined",
        path: ["storage"],
        message: "Required",
      },
    ];

    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when storage is invalid type", () => {
    const userConfig = merge({}, requiredConfig, {
      storage: "",
    });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: ["storage"],
        message: "Expected object, received string",
      },
    ];

    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  describe("storage.get", () => {
    test("throws when storage.get is missing", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      delete userConfig.storage.get;
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "undefined",
          path: ["storage", "get"],
          message: "Required",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when storage.get is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      userConfig.storage.get = "";
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "string",
          path: ["storage", "get"],
          message: "Expected function, received string",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("storage.set", () => {
    test("throws when storage.set is missing", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      delete userConfig.storage.set;
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "undefined",
          path: ["storage", "set"],
          message: "Required",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when storage.set is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      userConfig.storage.set = "";
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "string",
          path: ["storage", "set"],
          message: "Expected function, received string",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("storage.update", () => {
    test("throws when storage.update is missing", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      delete userConfig.storage.update;
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "undefined",
          path: ["storage", "update"],
          message: "Required",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when storage.update is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      userConfig.storage.update = "";
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "string",
          path: ["storage", "update"],
          message: "Expected function, received string",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("storage.delete", () => {
    test("throws when storage.delete is missing", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      delete userConfig.storage.delete;
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "undefined",
          path: ["storage", "delete"],
          message: "Required",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when storage.delete is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {});
      //@ts-ignore
      userConfig.storage.delete = "";
      const expected: any = [
        {
          code: "invalid_type",
          expected: "function",
          received: "string",
          path: ["storage", "delete"],
          message: "Expected function, received string",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });
});

describe("generateQr", () => {
  test("throws when generateQr is missing", () => {
    const userConfig = merge({}, requiredConfig, {});
    //@ts-ignore
    delete userConfig.generateQr;
    const expected: any = [
      {
        code: "invalid_type",
        expected: "function",
        received: "undefined",
        path: ["generateQr"],
        message: "Required",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when generateQr is null", () => {
    const userConfig = merge({}, requiredConfig, { generateQr: null });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "function",
        received: "null",
        path: ["generateQr"],
        message: "Expected function, received null",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when generateQr is invalid type", () => {
    const userConfig = merge({}, requiredConfig, {});
    //@ts-ignore
    userConfig.generateQr = "";
    const expected: any = [
      {
        code: "invalid_type",
        expected: "function",
        received: "string",
        path: ["generateQr"],
        message: "Expected function, received string",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });
});

describe("generateAvatar", () => {
  test("throws when generateAvatar is invalid type", () => {
    const userConfig = merge({}, requiredConfig, {
      generateAvatar: "",
    });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "function",
        received: "string",
        path: ["generateAvatar"],
        message: "Expected function, received string",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when generateAvatar is null", () => {
    const userConfig = merge({}, requiredConfig, { generateAvatar: null });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "function",
        received: "null",
        path: ["generateAvatar"],
        message: "Expected function, received null",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("passes when generateAvatar is valid type", () => {
    const userConfig = merge({}, requiredConfig, {
      generateAvatar: async () => ({
        data: "avatar-data",
        type: "svg" as "svg",
      }),
    });
    const expected: any = [];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });
});

describe("generateName", () => {
  test("throws when generateName is invalid type", () => {
    const userConfig = merge({}, requiredConfig, {
      generateName: "",
    });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "function",
        received: "string",
        path: ["generateName"],
        message: "Expected function, received string",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when generateName is null", () => {
    const userConfig = merge({}, requiredConfig, { generateName: null });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "function",
        received: "null",
        path: ["generateName"],
        message: "Expected function, received null",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("passes when generateName is valid type", () => {
    const userConfig = merge({}, requiredConfig, {
      generateName: async () => ({ name: "name" }),
    });
    const expected: any = [];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });
});

describe("pages", () => {
  test("throws when pages is invalid type", () => {
    const userConfig = merge({}, requiredConfig, {
      pages: "",
    });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: ["pages"],
        message: "Expected object, received string",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when pages contains invalid keys", () => {
    const userConfig = merge({}, requiredConfig, {
      pages: { foo: "bar" },
    });
    const expected: any = [
      {
        code: "unrecognized_keys",
        keys: ["foo"],
        path: ["pages"],
        message: "Unrecognized key(s) in object: 'foo'",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  describe("pages.lightningSignIn", () => {
    test("throws when pages.lightningSignIn is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { lightningSignIn: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["pages", "lightningSignIn"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when pages.lightningSignIn is empty string", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { lightningSignIn: "" },
      });
      const expected: any = [
        {
          validation: "regex",
          code: "invalid_string",
          message: "Invalid",
          path: ["pages", "lightningSignIn"],
        },
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "String must contain at least 1 character(s)",
          path: ["pages", "lightningSignIn"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when pages.lightningSignIn doesn't have leading slash", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { lightningSignIn: "signin" },
      });
      const expected: any = [
        {
          validation: "regex",
          code: "invalid_string",
          message: "Invalid",
          path: ["pages", "lightningSignIn"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when pages.lightningSignIn has leading slash", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { lightningSignIn: "/signin" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("pages.nostrSignIn", () => {
    test("throws when pages.nostrSignIn is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { nostrSignIn: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["pages", "nostrSignIn"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when pages.nostrSignIn is empty string", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { nostrSignIn: "" },
      });
      const expected: any = [
        {
          validation: "regex",
          code: "invalid_string",
          message: "Invalid",
          path: ["pages", "nostrSignIn"],
        },
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "String must contain at least 1 character(s)",
          path: ["pages", "nostrSignIn"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when pages.nostrSignIn doesn't have leading slash", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { nostrSignIn: "signin" },
      });
      const expected: any = [
        {
          validation: "regex",
          code: "invalid_string",
          message: "Invalid",
          path: ["pages", "nostrSignIn"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when pages.nostrSignIn has leading slash", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { nostrSignIn: "/signin" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("pages.error", () => {
    test("throws when pages.error is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { error: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["pages", "error"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when pages.error is empty string", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { error: "" },
      });
      const expected: any = [
        {
          validation: "regex",
          code: "invalid_string",
          message: "Invalid",
          path: ["pages", "error"],
        },
        {
          code: "too_small",
          minimum: 1,
          type: "string",
          inclusive: true,
          exact: false,
          message: "String must contain at least 1 character(s)",
          path: ["pages", "error"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when pages.error doesn't have leading slash", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { error: "error" },
      });
      const expected: any = [
        {
          validation: "regex",
          code: "invalid_string",
          message: "Invalid",
          path: ["pages", "error"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when pages.error has leading slash", () => {
      const userConfig = merge({}, requiredConfig, {
        pages: { error: "/error" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });
});

describe("flags", () => {
  test("throws when flags is invalid type", () => {
    const userConfig = merge({}, requiredConfig, {
      flags: "",
    });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: ["flags"],
        message: "Expected object, received string",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when flags contains invalid keys", () => {
    const userConfig = merge({}, requiredConfig, {
      flags: { foo: true },
    });
    const expected: any = [
      {
        code: "unrecognized_keys",
        keys: ["foo"],
        path: ["flags"],
        message: "Unrecognized key(s) in object: 'foo'",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  describe("flags.diagnostics", () => {
    test("throws when flags.diagnostics is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        flags: { diagnostics: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "boolean",
          received: "number",
          path: ["flags", "diagnostics"],
          message: "Expected boolean, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when flags.diagnostics is true", () => {
      const userConfig = merge({}, requiredConfig, {
        flags: { diagnostics: true },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when flags.diagnostics is false", () => {
      const userConfig = merge({}, requiredConfig, {
        flags: { diagnostics: false },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("flags.logs", () => {
    test("throws when flags.logs is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        flags: { logs: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "boolean",
          received: "number",
          path: ["flags", "logs"],
          message: "Expected boolean, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when flags.logs is true", () => {
      const userConfig = merge({}, requiredConfig, {
        flags: { logs: true },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when flags.logs is false", () => {
      const userConfig = merge({}, requiredConfig, {
        flags: { logs: false },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });
});

describe("theme", () => {
  test("throws when theme is invalid type", () => {
    const userConfig = merge({}, requiredConfig, {
      theme: "",
    });
    const expected: any = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: ["theme"],
        message: "Expected object, received string",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  test("throws when theme contains invalid keys", () => {
    const userConfig = merge({}, requiredConfig, {
      theme: { foo: true },
    });
    const expected: any = [
      {
        code: "unrecognized_keys",
        keys: ["foo"],
        path: ["theme"],
        message: "Unrecognized key(s) in object: 'foo'",
      },
    ];
    const output = parse(configValidation, userConfig);
    expect(output).toEqual(expected);
  });

  describe("theme.colorScheme", () => {
    test("throws when theme.colorScheme is not in union", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { colorScheme: "auto" },
      });
      const expected: any = [
        {
          code: "invalid_union",
          unionErrors: [
            {
              issues: [
                {
                  received: "auto",
                  code: "invalid_literal",
                  expected: "light",
                  path: ["theme", "colorScheme"],
                  message: 'Invalid literal value, expected "light"',
                },
              ],
              name: "ZodError",
            },
            {
              issues: [
                {
                  received: "auto",
                  code: "invalid_literal",
                  expected: "dark",
                  path: ["theme", "colorScheme"],
                  message: 'Invalid literal value, expected "dark"',
                },
              ],
              name: "ZodError",
            },
          ],
          path: ["theme", "colorScheme"],
          message: "Invalid input",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.colorScheme is light", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { colorScheme: "light" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.colorScheme is dark", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { colorScheme: "dark" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.background", () => {
    test("throws when theme.background is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { background: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "background"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.background is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { background: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "background"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.background is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { background: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.backgroundCard", () => {
    test("throws when theme.backgroundCard is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { backgroundCard: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "backgroundCard"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.backgroundCard is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { backgroundCard: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "backgroundCard"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.backgroundCard is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { backgroundCard: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.text", () => {
    test("throws when theme.text is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { text: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "text"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.text is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { text: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "text"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.text is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { text: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.error", () => {
    test("throws when theme.error is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { error: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "error"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.error is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { error: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "error"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.error is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { error: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.signInButtonBackground", () => {
    test("throws when theme.signInButtonBackground is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { signInButtonBackground: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "signInButtonBackground"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.signInButtonBackground is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { signInButtonBackground: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "signInButtonBackground"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.signInButtonBackground is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { signInButtonBackground: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.signInButtonText", () => {
    test("throws when theme.signInButtonText is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { signInButtonText: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "signInButtonText"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.signInButtonText is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { signInButtonText: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "signInButtonText"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.signInButtonText is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { signInButtonText: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.qrBackground", () => {
    test("throws when theme.qrBackground is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrBackground: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "qrBackground"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.qrBackground is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrBackground: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "qrBackground"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.qrBackground is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrBackground: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.qrForeground", () => {
    test("throws when theme.qrForeground is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrForeground: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["theme", "qrForeground"],
          message: "Expected string, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.qrForeground is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrForeground: 1 },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["theme", "qrForeground"],
          message: "Expected string, received number",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.qrForeground is a hex code", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrForeground: "#f0f" },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("theme.qrMargin", () => {
    test("throws when theme.qrMargin is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrMargin: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "number",
          received: "null",
          path: ["theme", "qrMargin"],
          message: "Expected number, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.qrMargin is negative", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrMargin: -1 },
      });
      const expected: any = [
        {
          code: "too_small",
          minimum: 0,
          type: "number",
          inclusive: false,
          exact: false,
          message: "Number must be greater than 0",
          path: ["theme", "qrMargin"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when theme.qrMargin too big", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrMargin: 11 },
      });
      const expected: any = [
        {
          code: "too_big",
          maximum: 10,
          type: "number",
          inclusive: true,
          exact: false,
          message: "Number must be less than or equal to 10",
          path: ["theme", "qrMargin"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when theme.qrMargin is a number", () => {
      const userConfig = merge({}, requiredConfig, {
        theme: { qrMargin: 1 },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("intervals.poll", () => {
    test("throws when intervals.poll is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { poll: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "number",
          received: "null",
          path: ["intervals", "poll"],
          message: "Expected number, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when intervals.poll too small", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { poll: 499 },
      });
      const expected: any = [
        {
          code: "too_small",
          minimum: 500,
          type: "number",
          inclusive: true,
          exact: false,
          message: "Number must be greater than or equal to 500",
          path: ["intervals", "poll"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when intervals.poll too big", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { poll: 5001 },
      });
      const expected: any = [
        {
          code: "too_big",
          maximum: 5000,
          type: "number",
          inclusive: true,
          exact: false,
          message: "Number must be less than or equal to 5000",
          path: ["intervals", "poll"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when intervals.poll is a number", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { poll: 1050 },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });

  describe("intervals.create", () => {
    test("throws when intervals.create is invalid type", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { create: null },
      });
      const expected: any = [
        {
          code: "invalid_type",
          expected: "number",
          received: "null",
          path: ["intervals", "create"],
          message: "Expected number, received null",
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when intervals.create too small", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { create: 29999 },
      });
      const expected: any = [
        {
          code: "too_small",
          minimum: 30000,
          type: "number",
          inclusive: true,
          exact: false,
          message: "Number must be greater than or equal to 30000",
          path: ["intervals", "create"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("throws when intervals.create too big", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { create: 3600001 },
      });
      const expected: any = [
        {
          code: "too_big",
          maximum: 3600000,
          type: "number",
          inclusive: true,
          exact: false,
          message: "Number must be less than or equal to 3600000",
          path: ["intervals", "create"],
        },
      ];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });

    test("passes when intervals.create is a number", () => {
      const userConfig = merge({}, requiredConfig, {
        intervals: { create: 600000 },
      });
      const expected: any = [];
      const output = parse(configValidation, userConfig);
      expect(output).toEqual(expected);
    });
  });
});
