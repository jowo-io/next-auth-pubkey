import { tokenValidation } from "../validation/api";
import {
  generateIdToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { HandlerArguments, HandlerReturn } from "../utils/handlers";

export default async function handler({
  body,
  cookies,
  url,
  config,
}: HandlerArguments): Promise<HandlerReturn> {
  let grantType, k1, refreshToken;
  try {
    ({
      grant_type: grantType,
      code: k1,
      refresh_token: refreshToken,
    } = tokenValidation.parse(body));
  } catch (e) {
    return { error: "BadRequest", log: e instanceof Error ? e.message : "" };
  }

  let pubkey: string;
  if (grantType === "authorization_code") {
    if (!k1) {
      return {
        error: "BadRequest",
        log: "The 'code' body argument is undefined",
      };
    }
    let session;
    try {
      session = await config.storage.get({ k1 }, url, config);
    } catch (e) {
      if (config.flags.diagnostics && config.flags.logs) {
        console.warn(
          `An error occurred in the storage.get method. To debug the error see: ${
            config.baseUrl + config.apis.diagnostics
          }`
        );
      }
      return { error: "Default", log: e instanceof Error ? e.message : "" };
    }
    if (!session?.success) {
      return {
        error: "Unauthorized",
        log: "The 'success' boolean was undefined",
      };
    }
    if (!session?.pubkey) {
      return { error: "Unauthorized", log: "The 'pubkey' was undefined" };
    }
    pubkey = session.pubkey;

    try {
      await config.storage.delete({ k1 }, url, config);
    } catch (e) {
      if (config.flags.logs) {
        console.error(e);
      }
      if (config.flags.diagnostics && config.flags.logs) {
        console.warn(
          `An error occurred in the storage.delete method. To debug the error see: ${
            config.baseUrl + config.apis.diagnostics
          }`
        );
      }
    }
  } else if (grantType === "refresh_token") {
    if (!refreshToken) {
      return {
        error: "BadRequest",
        log: "The 'refresh_token' body argument is undefined",
      };
    }
    const data = await verifyRefreshToken(refreshToken, config);
    if (!data.pubkey) {
      return {
        error: "BadRequest",
        log: "The 'pubkey' is undefined in the refresh token",
      };
    }
    pubkey = data.pubkey;
  } else {
    return {
      error: "BadRequest",
      log: "Invalid 'grant_type' body argument, supported: 'authorization_code' and 'refresh_token'",
    };
  }

  let name = null;
  if (config.generateName) {
    try {
      name = (await config.generateName(pubkey, config))?.name;
      if (!name || typeof name !== "string") {
        throw new Error(
          `Invalid 'name' property returned from the generateName method.`
        );
      }
    } catch (e) {
      if (config.flags.diagnostics && config.flags.logs) {
        console.warn(
          `An error occurred in the generateName method. To debug the error see: ${
            config.baseUrl + config.apis.diagnostics
          }`
        );
      }
      return { error: "Default", log: e instanceof Error ? e.message : "" };
    }
  }
  const image = config?.generateAvatar
    ? `${config.baseUrl}${config.apis.avatar}/${pubkey}`
    : null;

  const token = {
    // meta
    token_type: "Bearer",
    scope: "user",

    // id token
    expires_in: config.intervals.idToken,
    expires_at: Math.floor(Date.now() / 1000 + config.intervals.idToken),
    id_token: await generateIdToken(pubkey, name, image, config),

    // refresh token
    refresh_token: await generateRefreshToken(pubkey, config),
  };

  return {
    response: {
      success: true,
      ...token,
    },
  };
}
