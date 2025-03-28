import { NextApiRequest, NextApiResponse } from "next/types";
import { NextRequest } from "next/server";

import { Config } from "../config/index";

import { cleanParams, paramsToObject } from "./params";

// auth apis
import createHandler from "../handlers/create";
import pollHandler from "../handlers/poll";
import callbackHandler from "../handlers/callback";
import tokenHandler from "../handlers/token";

// pages
import lightningSignInHandler from "../handlers/lightning-signin";
import nostrSignInHandler from "../handlers/nostr-signin";

// misc
import avatarHandler from "../handlers/avatar";
import qrHandler from "../handlers/qr";
import diagnosticsHandler from "../handlers/diagnostics";

export type HandlerArguments = {
  query?: Record<string, string | boolean | number | undefined | null>;
  body?: Record<string, string | boolean | number | undefined | null>;
  cookies: {
    sessionToken?: string;
  };
  url: URL;
  config: Config;
};

export enum HandlerErrorCodes {
  // An attempted API request was made to an auth endpoint while already logged in.
  Forbidden = "You are already logged in.",

  // An API request was made to a non existent `lnurl-auth` API path.
  NotFound = "Path not found.",

  // Authorizing the user failed because the `lnurl-auth` callback received an invalid `signature` / `pubkey`
  Unauthorized = "You could not be signed in.",

  // The user's session has been deleted. Either their session expired or they had a failed sign in attempt and must create a new session.
  Gone = "Session not found.",

  // An API request was made to the `lnurl-auth` APIs with a missing required query param or body arguments.
  BadRequest = "Missing required query or body arguments.",

  // Generic catch-all error code when one of the above errors is not matched.
  Default = "Unable to sign in.",
}

type HandlerError = {
  // error
  error: keyof typeof HandlerErrorCodes;
  log?: string;
  message?: string;
  status?: 302 | 404 | 410 | 500;
  headers?: Record<string, string>;
};

type HandlerRedirect = {
  // redirect
  redirect: URL;
};

type HandlerResponse = {
  // response
  status?: 200;
  headers?: Record<string, string>;
  response:
    | string
    | Buffer
    | Record<string, string | boolean | number | undefined | null>;
};

export type HandlerReturn = HandlerRedirect | HandlerError | HandlerResponse;

export async function pagesHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  config: Config,
  handler: (args: HandlerArguments) => Promise<HandlerReturn>
) {
  const query = cleanParams(req.query);
  const body = req.body || {};

  const url = new URL(config.baseUrl + req.url);

  const args: HandlerArguments = {
    query,
    body,
    cookies: {
      sessionToken: req.cookies["next-auth.session-token"],
    },
    url,
    config,
  };

  let output: HandlerReturn;
  try {
    output = await handler(args);
  } catch (e) {
    output = {
      error: "Default",
      message: HandlerErrorCodes.Default,
      status: 500,
      log: e instanceof Error ? e.message : "",
    };
  }

  if ("error" in output) {
    if (output.log) {
      console.error(output.log);
    }

    const errorUrl = new URL(config.baseUrl + config.pages.error);
    if (config.pages.error === "/api/auth/error") {
      // if using default next-auth error screen
      errorUrl.searchParams.append("error", "OAuthSignin");
    } else {
      // otherwise use `next-auth-pubkey` params
      errorUrl.searchParams.append("error", output.error);
      errorUrl.searchParams.append("message", HandlerErrorCodes[output.error]);
    }

    if (output.status === 302) {
      return res.redirect(errorUrl.toString()).end();
    } else {
      Object.entries(output.headers || {}).forEach(([key, value]) =>
        res.setHeader(key, value)
      );
      res.status(output.status || 500);
      return res.send(
        JSON.stringify({
          error: output.error,
          message: HandlerErrorCodes[output.error],
          url: errorUrl.toString(),
        })
      );
    }
  }

  if ("redirect" in output) {
    return res.redirect(output.redirect.toString()).end();
  }

  if ("response" in output) {
    Object.entries(output.headers || {}).forEach(([key, value]) =>
      res.setHeader(key, value)
    );

    res.status(output.status || 200);
    if (
      typeof output.response === "string" ||
      output.response instanceof Buffer
    ) {
      return res.send(output.response);
    } else if (typeof output.response === "object") {
      return res.send(JSON.stringify(output.response));
    }
  }
}

export async function appHandler(
  req: NextRequest,
  config: Config,
  handler: (args: HandlerArguments) => Promise<HandlerReturn>
) {
  const query = paramsToObject(req.nextUrl.searchParams);
  const text = await req.text();
  const params = new URLSearchParams(text);
  const body = paramsToObject(params);

  const url = new URL(config.baseUrl + req.nextUrl.pathname);

  const args: HandlerArguments = {
    query,
    body,
    cookies: {
      sessionToken: req.cookies.get("next-auth.session-token")?.value,
    },
    url,
    config,
  };

  let output: HandlerReturn;
  try {
    output = await handler(args);
  } catch (e) {
    output = {
      error: "Default",
      message: HandlerErrorCodes.Default,
      status: 500,
      log: e instanceof Error ? e.message : "",
    };
  }

  if ("error" in output) {
    if (output.log) {
      console.error(output.log);
    }

    const errorUrl = new URL(config.baseUrl + config.pages.error);
    if (config.pages.error === "/api/auth/error") {
      // if using default next-auth error screen
      errorUrl.searchParams.append("error", "OAuthSignin");
    } else {
      // otherwise use `next-auth-pubkey` params
      errorUrl.searchParams.append("error", output.error);
      errorUrl.searchParams.append("message", HandlerErrorCodes[output.error]);
    }

    if (output.status === 302) {
      return Response.redirect(errorUrl.toString());
    } else {
      return Response.json(
        {
          error: output.error,
          message: HandlerErrorCodes[output.error],
          url: errorUrl.toString(),
        },
        {
          status: output.status || 500,
          headers: output.headers || {},
        }
      );
    }
  }

  if ("redirect" in output) {
    return Response.redirect(output.redirect.toString());
  }

  if ("response" in output) {
    const options = {
      status: output.status || 200,
      headers: output.headers || {},
    };
    if (
      typeof output.response === "string" ||
      output.response instanceof Buffer
    ) {
      return new Response(output.response, options);
    } else if (typeof output.response === "object") {
      return Response.json(output.response, options);
    }
  }
}

type Arguments = {
  config: Config;
  req: NextApiRequest | NextRequest;
  res?: NextApiResponse;
};

export default function getHandler(args: Arguments) {
  const { req, res, config } = args;

  // get path from either pages or app router req/res objects
  const path = (res as any)?.params
    ? new URL((req as NextRequest).nextUrl).pathname
    : (req as any)?.url;

  let handler;
  if (path?.indexOf(config.apis.create) > -1) {
    return createHandler;
  } else if (path?.indexOf(config.apis.poll) > -1) {
    return pollHandler;
  } else if (path?.indexOf(config.apis.callback) > -1) {
    return callbackHandler;
  } else if (path?.indexOf(config.apis.token) > -1) {
    return tokenHandler;
  } else if (path?.indexOf(config.apis.lightningSignIn) > -1) {
    return lightningSignInHandler;
  } else if (path?.indexOf(config.apis.nostrSignIn) > -1) {
    return nostrSignInHandler;
  } else if (path?.indexOf(config.apis.avatar) > -1) {
    return avatarHandler;
  } else if (path?.indexOf(config.apis.qr) > -1) {
    return qrHandler;
  } else if (
    path?.indexOf(config.apis.diagnostics) > -1 &&
    config.flags.diagnostics
  ) {
    return diagnosticsHandler;
  }

  return async function ({}: HandlerArguments): Promise<HandlerReturn> {
    return {
      error: "NotFound",
      status: 404,
    };
  };
}
