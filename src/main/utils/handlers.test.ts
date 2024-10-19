import { describe, expect, test } from "@jest/globals";
import merge from "lodash.merge";
import { NextApiRequest, NextApiResponse } from "next/types";
import { NextRequest, NextResponse } from "next/server";

import { pagesHandler, appHandler, HandlerErrorCodes } from "./handlers";
import { Config } from "../config";
import { defaultConfig } from "../config/default";

const config = merge({}, defaultConfig, {
  baseUrl: "http://a.b",
  theme: { qrForeground: "#fff", qrBackground: "#000", qrMargin: 1 },
}) as Config;

class MockResponse {
  constructor() {}
}

describe("generateQr", () => {
  let r: any;
  beforeAll(() => {
    r = global.Response;
  });
  afterAll(() => {
    global.Response = r;
  });
  beforeEach(() => {
    //@ts-ignore
    MockResponse.json = jest.fn(() => "json-output");
    //@ts-ignore
    MockResponse.redirect = jest.fn(() => "redirect-output");
    // @ts-ignore
    global.Response = MockResponse;
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("dynamic handler invoked with arguments", () => {
    const handlerResponse = { response: { data: "data" } };
    const args = {
      query: { hello: "world" },
      body: { foo: "bar" },
      cookies: { sessionToken: "cookie" },
      url: new URL(config.baseUrl + "/foo/bar"),
      config,
    };
    test("pages router triggers output with args", async () => {
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {
          "next-auth.session-token": "cookie",
          foo: "bar",
        },
      } as unknown as NextApiRequest;
      const res = {
        status: jest.fn(),
        send: jest.fn(() => "send-output"),
        setHeader: jest.fn(),
      } as unknown as NextApiResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(handler).toHaveBeenCalledWith(args);
      expect(output).toEqual("send-output");
    });

    test("app router triggers output with args", async () => {
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn(() => ({ value: "cookie" })) },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;

      const handler = jest.fn(async () => handlerResponse);
      await appHandler(req, res, config, handler);
      expect(handler).toHaveBeenCalledWith(args);
    });
  });

  describe("returns response", () => {
    const handlerResponse = {
      response: { data: "data" },
    };
    test("pages router response", async () => {
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const res = {
        status: jest.fn(),
        send: jest.fn(() => "send-output"),
        setHeader: jest.fn(),
      } as unknown as NextApiResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(res.send).toHaveBeenCalledWith(
        JSON.stringify(handlerResponse.response)
      );
      expect(output).toEqual("send-output");
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("app router response", async () => {
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      // @ts-ignore
      expect(MockResponse.json).toHaveBeenCalledWith(
        { data: "data" },
        { headers: {}, status: 200 }
      );
      expect(output).toEqual("json-output");
    });
  });

  describe("returns with status and headers", () => {
    const handlerResponse = {
      response: { data: "data" },
      headers: { things: "stuff" },
    };
    test("pages router response", async () => {
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const res = {
        status: jest.fn(),
        send: jest.fn(() => "send-output"),
        setHeader: jest.fn(),
      } as unknown as NextApiResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(res.send).toHaveBeenCalledWith(
        JSON.stringify(handlerResponse.response)
      );
      expect(output).toEqual("send-output");
      expect(res.setHeader).toHaveBeenCalledWith("things", "stuff");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("app router response", async () => {
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      // @ts-ignore
      expect(MockResponse.json).toHaveBeenCalledWith(
        { data: "data" },
        { headers: { things: "stuff" }, status: 200 }
      );
      expect(output).toEqual("json-output");
    });
  });

  describe("returns buffer response", () => {
    const handlerResponse = {
      response: Buffer.from("data"),
    };
    test("pages router response", async () => {
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const res = {
        status: jest.fn(),
        send: jest.fn(() => "send-output"),
        setHeader: jest.fn(),
      } as unknown as NextApiResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(res.send).toHaveBeenCalledWith(handlerResponse.response);
      expect(output).toEqual("send-output");
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("app router response", async () => {
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      expect(output).toEqual(
        new Response(handlerResponse.response, { headers: {}, status: 200 })
      );
    });
  });

  describe("returns redirect", () => {
    const handlerResponse = {
      redirect: new URL(config.baseUrl + "/hello/world"),
    };
    test("pages router response", async () => {
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const end = jest.fn(() => "redirect-output");
      const redirect = jest.fn(() => ({ end }));
      const res = { redirect } as unknown as NextApiResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(redirect).toHaveBeenCalledWith(
        handlerResponse.redirect.toString()
      );
      expect(end).toHaveBeenCalled();
      expect(output).toEqual("redirect-output");
    });

    test("app router response", async () => {
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      // @ts-ignore
      expect(MockResponse.redirect).toHaveBeenCalledWith(
        handlerResponse.redirect.toString()
      );
      expect(output).toEqual("redirect-output");
    });
  });

  describe("error 302 default redirect", () => {
    const handlerResponse = {
      status: 302 as 302,
      error: "Default" as "Default",
    };

    const expected = new URL(config.baseUrl + config.pages.error);
    expected.searchParams.append("error", "OAuthSignin");

    test("pages router response", async () => {
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const end = jest.fn(() => "redirect-output");
      const redirect = jest.fn(() => ({ end }));
      const res = { redirect } as unknown as NextApiResponse;
      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(redirect).toHaveBeenCalledWith(expected.toString());
      expect(end).toHaveBeenCalled();
      expect(output).toEqual("redirect-output");
    });

    test("app router response", async () => {
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;
      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      // @ts-ignore
      expect(MockResponse.redirect).toHaveBeenCalledWith(expected.toString());
      expect(output).toEqual("redirect-output");
    });
  });

  describe("error 302 custom redirect", () => {
    const errorPage = "/error";
    const handlerResponse = {
      status: 302 as 302,
      error: "Default" as "Default",
    };

    const expected = new URL(config.baseUrl + errorPage);
    expected.searchParams.append("error", handlerResponse.error);
    expected.searchParams.append(
      "message",
      HandlerErrorCodes[handlerResponse.error]
    );

    beforeAll(() => {
      config.pages.error = errorPage;
    });
    afterAll(() => {
      config.pages.error = defaultConfig.pages.error;
    });

    test("pages router response", async () => {
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const end = jest.fn(() => "redirect-output");
      const redirect = jest.fn(() => ({ end }));
      const res = { redirect } as unknown as NextApiResponse;
      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(redirect).toHaveBeenCalledWith(expected.toString());
      expect(end).toHaveBeenCalled();
      expect(output).toEqual("redirect-output");
    });

    test("app router response", async () => {
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;
      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      // @ts-ignore
      expect(MockResponse.redirect).toHaveBeenCalledWith(expected.toString());
      expect(output).toEqual("redirect-output");
    });
  });

  describe("returns error and logs it", () => {
    const handlerResponse = {
      error: "Default" as "Default",
    };
    test("pages router response", async () => {
      jest.spyOn(console, "error").mockImplementation();
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const res = {
        status: jest.fn(),
        send: jest.fn(() => "send-output"),
        setHeader: jest.fn(),
      } as unknown as NextApiResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(res.send).toHaveBeenCalledWith(
        JSON.stringify({
          error: "Default",
          message: "Unable to sign in.",
          url: "http://a.b/api/auth/error?error=OAuthSignin",
        })
      );
      expect(output).toEqual("send-output");
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(console.error).not.toHaveBeenCalled();
    });

    test("app router response", async () => {
      jest.spyOn(console, "error").mockImplementation();
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      // @ts-ignore
      expect(MockResponse.json).toHaveBeenCalledWith(
        {
          error: "Default",
          message: "Unable to sign in.",
          url: "http://a.b/api/auth/error?error=OAuthSignin",
        },
        { headers: {}, status: 500 }
      );
      expect(output).toEqual("json-output");
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("returns error with status and headers and log", () => {
    const handlerResponse = {
      error: "Default" as "Default",
      status: 404 as 404,
      headers: { things: "stuff" },
      log: "log me",
    };

    test("pages router response", async () => {
      jest.spyOn(console, "error").mockImplementation();
      const req = {
        body: { foo: "bar" },
        query: { hello: "world" },
        url: "/foo/bar",
        cookies: {},
      } as unknown as NextApiRequest;
      const res = {
        status: jest.fn(),
        send: jest.fn(() => "send-output"),
        setHeader: jest.fn(),
      } as unknown as NextApiResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await pagesHandler(req, res, config, handler);
      expect(res.send).toHaveBeenCalledWith(
        JSON.stringify({
          error: "Default",
          message: "Unable to sign in.",
          url: "http://a.b/api/auth/error?error=OAuthSignin",
        })
      );
      expect(output).toEqual("send-output");
      expect(res.setHeader).toHaveBeenCalledWith("things", "stuff");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(console.error).toHaveBeenCalledWith(handlerResponse.log);
    });

    test("app router response", async () => {
      jest.spyOn(console, "error").mockImplementation();
      const req = {
        text: jest.fn(async () => "foo=bar"),
        nextUrl: new URL(config.baseUrl + "/foo/bar" + "?hello=world"),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;
      const res = {
        params: {},
      } as unknown as NextResponse;

      const handler = jest.fn(async () => handlerResponse);
      const output = await appHandler(req, res, config, handler);
      // @ts-ignore
      expect(MockResponse.json).toHaveBeenCalledWith(
        {
          error: "Default",
          message: "Unable to sign in.",
          url: "http://a.b/api/auth/error?error=OAuthSignin",
        },
        { headers: { things: "stuff" }, status: 404 }
      );
      expect(output).toEqual("json-output");
      expect(console.error).toHaveBeenCalledWith(handlerResponse.log);
    });
  });
});
