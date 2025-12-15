import { randomBytes } from "crypto";
import lnurlEncode from "../../utils/lnurl/encode";

import { createValidation } from "../validation/api";
import { HandlerArguments, HandlerReturn } from "../utils/handlers";

export default async function handler({
  body,
  cookies,
  url,
  config,
}: HandlerArguments): Promise<HandlerReturn> {
  let state, oldK1;
  try {
    ({ state, k1: oldK1 } = createValidation.parse(body));
  } catch (e) {
    return { error: "BadRequest", log: e instanceof Error ? e.message : "" };
  }

  // if an old k1 is provided, delete it
  if (typeof oldK1 === "string") {
    try {
      await config.storage.delete({ k1: oldK1 }, url, config);
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
  }

  const k1 = randomBytes(32).toString("hex");

  const callbackUrl = new URL(config.baseUrl + config.apis.callback);
  callbackUrl.searchParams.append("k1", k1);
  callbackUrl.searchParams.append("tag", "login");

  const encoded = lnurlEncode(callbackUrl.toString()).toUpperCase();

  try {
    await config.storage.set({ k1, data: { k1, state } }, url, config);
  } catch (e) {
    if (config.flags.diagnostics && config.flags.logs) {
      console.warn(
        `An error occurred in the storage.set method. To debug the error see: ${
          config.baseUrl + config.apis.diagnostics
        }`
      );
    }
    return { error: "Default", log: e instanceof Error ? e.message : "" };
  }

  return {
    response: {
      success: true,
      k1,
      lnurl: encoded,
      pollInterval: config.intervals.poll,
      createInterval: config.intervals.create,
    },
  };
}
