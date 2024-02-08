import { NextApiRequest, NextApiResponse } from "next/types";
import { OAuthConfig } from "next-auth/providers/oauth";

import { Config, formatConfig, UserConfig } from "./config/index";
import { NextRequest, NextResponse } from "next/server";
import {
  pagesHandler,
  appHandler,
  HandlerArguments,
  HandlerReturn,
} from "./utils/handlers";

// auth apis
import createHandler from "./handlers/create";
import pollHandler from "./handlers/poll";
import callbackHandler from "./handlers/callback";
import tokenHandler from "./handlers/token";

// pages
import lightningSignInHandler from "./handlers/lightning-signin";
import nostrSignInHandler from "./handlers/nostr-signin";

// misc
import avatarHandler from "./handlers/avatar";
import qrHandler from "./handlers/qr";
import diagnosticsHandler from "./handlers/diagnostics";

const lightningLogo =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgyIiBoZWlnaHQ9IjI4MiIgdmlld0JveD0iMCAwIDI4MiAyODIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiPgo8Y2lyY2xlIGN4PSIxNDAuOTgzIiBjeT0iMTQxLjAwMyIgcj0iMTQxIiBmaWxsPSIjN0IxQUY3Ii8+CjxwYXRoIGQ9Ik03OS43NjA5IDE0NC4wNDdMMTczLjc2MSA2My4wNDY2QzE3Ny44NTcgNjAuNDIzNSAxODEuNzYxIDYzLjA0NjYgMTc5LjI2MSA2Ny41NDY2TDE0OS4yNjEgMTI2LjU0N0gyMDIuNzYxQzIwMi43NjEgMTI2LjU0NyAyMTEuMjYxIDEyNi41NDcgMjAyLjc2MSAxMzMuNTQ3TDExMC4yNjEgMjE1LjA0N0MxMDMuNzYxIDIyMC41NDcgOTkuMjYxIDIxNy41NDcgMTAzLjc2MSAyMDkuMDQ3TDEzMi43NjEgMTUxLjU0N0g3OS43NjA5Qzc5Ljc2MDkgMTUxLjU0NyA3MS4yNjA5IDE1MS41NDcgNzkuNzYwOSAxNDQuMDQ3WiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMCI+CjxyZWN0IHdpZHRoPSIyODIiIGhlaWdodD0iMjgyIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=";

const nostrLogo =
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI3LjUuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9Il84IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjU2IDI1NiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjU2IDI1NjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOm5vbmU7fQoJLnN0MXtmaWxsOiNGRkZGRkY7fQoJLnN0MntmaWxsOiM2NjI0ODI7fQo8L3N0eWxlPgo8Zz4KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0wLDB2MjU2aDI1NlYwSDB6IE0yMzEuMiwxNTkuMmMwLDIwLjcsMCwzMS4xLTMuNSw0Mi4yYy00LjQsMTIuMi0xNCwyMS44LTI2LjIsMjYuMgoJCWMtMTEuMSwzLjUtMjEuNSwzLjUtNDIuMiwzLjVIOTYuOGMtMjAuNywwLTMxLjEsMC00Mi4yLTMuNWMtMTIuMi00LjQtMjEuOC0xNC0yNi4yLTI2LjJjLTMuNS0xMS4xLTMuNS0yMS41LTMuNS00Mi4yVjk2LjgKCQljMC0yMC43LDAtMzEuMSwzLjUtNDIuMmM0LjQtMTIuMiwxNC0yMS44LDI2LjItMjYuMmMxMS4yLTMuNSwyMS41LTMuNSw0Mi4yLTMuNWg2Mi41YzIwLjcsMCwzMS4xLDAsNDIuMiwzLjUKCQljMTIuMiw0LjQsMjEuOCwxNCwyNi4yLDI2LjJjMy41LDExLjEsMy41LDIxLjUsMy41LDQyLjJWMTU5LjJ6Ii8+Cgk8Y2lyY2xlIGNsYXNzPSJzdDEiIGN4PSIxMzcuOSIgY3k9Ijk5IiByPSIxMi4xIi8+Cgk8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMjEwLjgsMTE1LjljMC00Ny4zLTI3LjctNjguNy02NC40LTY4LjdjLTE2LjQsMC0zMSw0LjQtNDIuNCwxMi41Yy0zLjgsMi43LTksMC4xLTktNC41CgkJYzAtMy4xLTIuNS01LjctNS43LTUuN0g1Ny43Yy0zLjEsMC01LjcsMi41LTUuNyw1Ljd2MTQ0YzAsMy4xLDIuNSw1LjcsNS43LDUuN2gzMy43YzMuMSwwLDUuNi0yLjUsNS42LTUuNnYtOC40CgkJYzAtNjIuOC0zMy4yLTEwOS44LTAuNC0xMTZjMzAtNS43LDY0LjEtMyw2NC41LDIwLjFjMCwyLDAuMyw4LDguNiwxMS4yYzUsMiwxMi42LDIuNiwyMi42LDIuNGMwLDAsOS4xLTAuNyw5LjEsOC41CgkJYzAsMTEuNS0yMC40LDEwLjctMjAuNCwxMC43Yy02LjcsMC4zLTIyLjYtMS41LTMxLjcsMS4yYy00LjgsMS41LTksNC4yLTExLjUsOS4xYy00LjIsOC4zLTYuMiwyNi41LTYuNSw0NS41djE1LjUKCQljMCwzLjEsMi41LDUuNyw1LjcsNS43aDY4YzMuMSwwLDUuNy0yLjUsNS43LTUuN2wwLDBWMTE1Ljl6Ii8+Cgk8cGF0aCBjbGFzcz0ic3QyIiBkPSJNMjI3LjYsNTQuNmMtNC40LTEyLjItMTQtMjEuOC0yNi4yLTI2LjJjLTExLjEtMy41LTIxLjUtMy41LTQyLjItMy41SDk2LjhjLTIwLjcsMC0zMS4xLDAtNDIuMiwzLjUKCQljLTEyLjIsNC40LTIxLjgsMTQtMjYuMiwyNi4yYy0zLjUsMTEuMi0zLjUsMjEuNS0zLjUsNDIuMnY2Mi41YzAsMjAuNywwLDMxLjEsMy41LDQyLjJjNC40LDEyLjIsMTQsMjEuOCwyNi4yLDI2LjIKCQljMTEuMiwzLjUsMjEuNSwzLjUsNDIuMiwzLjVoNjIuNWMyMC43LDAsMzEuMSwwLDQyLjItMy41YzEyLjItNC40LDIxLjgtMTQsMjYuMi0yNi4yYzMuNS0xMS4xLDMuNS0yMS41LDMuNS00Mi4yVjk2LjgKCQlDMjMxLjIsNzYuMSwyMzEuMiw2NS43LDIyNy42LDU0LjZ6IE0yMDUuMSwyMDQuOGgtNjhjLTMuMSwwLTUuNy0yLjUtNS43LTUuN3YtMTUuNWMwLjMtMTksMi4zLTM3LjIsNi41LTQ1LjUKCQljMi41LTUsNi43LTcuNywxMS41LTkuMWM5LTIuNywyNC45LTAuOSwzMS43LTEuMmMwLDAsMjAuNCwwLjgsMjAuNC0xMC43YzAtOS4zLTkuMS04LjUtOS4xLTguNWMtMTAsMC4zLTE3LjctMC40LTIyLjYtMi40CgkJYy04LjMtMy4zLTguNi05LjItOC42LTExLjJjLTAuNC0yMy4xLTM0LjUtMjUuOS02NC41LTIwLjFjLTMyLjgsNi4yLDAuNCw1My4zLDAuNCwxMTZ2OC40Yy0wLjEsMy4xLTIuNSw1LjYtNS42LDUuNkg1Ny43CgkJYy0zLjEsMC01LjctMi41LTUuNy01Ljd2LTE0NGMwLTMuMSwyLjUtNS43LDUuNy01LjdoMzEuN2MzLjEsMCw1LjcsMi41LDUuNyw1LjdjMCw0LjcsNS4yLDcuMiw5LDQuNWMxMS40LTguMiwyNi0xMi41LDQyLjQtMTIuNQoJCWMzNi43LDAsNjQuNCwyMS40LDY0LjQsNjguN3Y4My4ybDAsMEMyMTAuOCwyMDIuMywyMDguMywyMDQuOCwyMDUuMSwyMDQuOHogTTEyNS43LDk5YzAtNi43LDUuNC0xMi4xLDEyLjEtMTIuMVMxNTAsOTIuMywxNTAsOTkKCQlzLTUuNCwxMi4xLTEyLjEsMTIuMVMxMjUuNywxMDUuOCwxMjUuNyw5OXoiLz4KPC9nPgo8L3N2Zz4K";

export interface PubKeyAuthProfile
  extends Record<string, string | number | null> {
  id: string;
  image: string | null;
  name: string | null;
  iat: number;
  iss: string;
  aud: string;
  exp: number;
  sub: string;
}

/**
 * Generate a provider and handler to setup Lightning auth.
 *
 * @param {Object} userConfig - config options, see the package README for details
 *
 * @returns {Object}
 * @returns {String} provider - a provider that can be added to the `next-auth` config's providerArray
 * @returns {String} handler - an API handler to be exported in the pages/api/pubkey/[...pubkey] folder
 */
export default function NextAuthLightning(userConfig: UserConfig) {
  const config = formatConfig(userConfig);

  const lightningProvider: OAuthConfig<PubKeyAuthProfile> = {
    id: "lightning",
    name: "Lightning",
    type: "oauth",
    version: "2.0",
    checks: ["state"],
    issuer: config.baseUrl,
    token: config.baseUrl + config.apis.token,
    authorization: config.baseUrl + config.pages.lightningSignIn,
    profile(profile) {
      return {
        id: profile.id,
        name: profile.name || profile.id,
        image: profile.image,
      };
    },
    idToken: true,
    client: {
      id_token_signed_response_alg: "HS256",
    },
    clientId: config.baseUrl,
    clientSecret: config.secret,
    style: {
      logo: lightningLogo,
      bg: config.theme.signInButtonBackground,
      text: config.theme.signInButtonText,
    },
  };

  const nostrProvider: OAuthConfig<PubKeyAuthProfile> = {
    id: "nostr",
    name: "Nostr",
    type: "oauth",
    version: "2.0",
    checks: ["state"],
    issuer: config.baseUrl,
    token: config.baseUrl + config.apis.token,
    authorization: config.baseUrl + config.pages.nostrSignIn,
    profile(profile) {
      return {
        id: profile.id,
        name: profile.name || profile.id,
        image: profile.image,
      };
    },
    idToken: true,
    client: {
      id_token_signed_response_alg: "HS256",
    },
    clientId: config.baseUrl,
    clientSecret: config.secret,
    style: {
      logo: nostrLogo,
      bg: config.theme.signInButtonBackground,
      text: config.theme.signInButtonText,
    },
  };

  const dynamicHandler = async function pubkeyHandler<Req, Res, Return>(
    req: Req,
    res: Res,
    handler: (
      req: Req,
      res: Res,
      config: Config,
      handler: (args: HandlerArguments) => Promise<HandlerReturn>
    ) => Promise<Return>
  ) {
    // get path from either pages or app router req/res objects
    let path = (res as any)?.params
      ? new URL((req as NextRequest).nextUrl).pathname
      : (req as any)?.url;

    if (path?.indexOf(config.apis.create) === 0) {
      return await handler(req, res, config, createHandler);
    } else if (path?.indexOf(config.apis.poll) === 0) {
      return await handler(req, res, config, pollHandler);
    } else if (path?.indexOf(config.apis.callback) === 0) {
      return await handler(req, res, config, callbackHandler);
    } else if (path?.indexOf(config.apis.token) === 0) {
      return await handler(req, res, config, tokenHandler);
    } else if (path?.indexOf(config.apis.lightningSignIn) === 0) {
      return await handler(req, res, config, lightningSignInHandler);
    } else if (path?.indexOf(config.apis.nostrSignIn) === 0) {
      return await handler(req, res, config, nostrSignInHandler);
    } else if (path?.indexOf(config.apis.avatar) === 0) {
      return await handler(req, res, config, avatarHandler);
    } else if (path?.indexOf(config.apis.qr) === 0) {
      return await handler(req, res, config, qrHandler);
    } else if (
      path?.indexOf(config.apis.diagnostics) === 0 &&
      config.flags.diagnostics
    ) {
      return await handler(req, res, config, diagnosticsHandler);
    }

    return await handler(req, res, config, async () => ({
      error: "NotFound",
      status: 404,
    }));
  };

  return {
    lightningProvider,
    nostrProvider,
    handler: async (req: NextApiRequest, res: NextApiResponse) =>
      dynamicHandler(req, res, pagesHandler),
    GET: async (req: NextRequest, res: NextResponse) =>
      dynamicHandler(req, res, appHandler),
    POST: async (req: NextRequest, res: NextResponse) =>
      dynamicHandler(req, res, appHandler),
  };
}
