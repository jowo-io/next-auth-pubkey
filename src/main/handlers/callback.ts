import {
  callbackQueryValidation,
  callbackBodyValidation,
} from "../validation/api";
import { HandlerArguments, HandlerReturn } from "../utils/handlers";
import lnurlVerifyAuthorizationSignature from "lnurl/lib/verifyAuthorizationSignature.js";
import { createHash } from "crypto";
import { schnorr } from "@noble/curves/secp256k1";

export default async function handler({
  body,
  query,
  cookies,
  url,
  config,
}: HandlerArguments): Promise<HandlerReturn> {
  let authorize;
  let k1, pubkey, sig;

  if (body?.event) {
    let event;
    try {
      ({ event } = callbackBodyValidation.parse(body));
    } catch (e) {
      return { error: "BadRequest", log: e instanceof Error ? e.message : "" };
    }

    try {
      // is the event id a hash of this event
      const id = createHash("sha256")
        .update(
          JSON.stringify([
            0,
            event.pubkey,
            event.created_at,
            event.kind,
            event.tags,
            event.content,
          ])
        )
        .digest("hex");
      if (id !== event.id) {
        throw new Error("Invalid event id");
      }

      // is the signature valid
      if (!(await schnorr.verify(event.sig, event.id, event.pubkey))) {
        throw new Error("Invalid signature");
      }

      // is the challenge present in the event
      if (!(event.tags[0].length === 2 && event.tags[0][0] === "challenge")) {
        throw new Error('Expected tags = [["challenge", <challenge>]]');
      }

      pubkey = event.pubkey;
      sig = event.sig;
      k1 = event.tags[0][1];
      authorize = true;
    } catch (e: any) {
      return {
        error: "Unauthorized",
        log: e?.message ? e.message : "",
      };
    }
  } else {
    try {
      ({ k1, key: pubkey, sig } = callbackQueryValidation.parse(query));
    } catch (e) {
      return { error: "BadRequest", log: e instanceof Error ? e.message : "" };
    }

    try {
      if (!(await lnurlVerifyAuthorizationSignature(sig, k1, pubkey))) {
        throw new Error("Invalid signature");
      }
      authorize = true;
    } catch (e: any) {
      return {
        error: "Unauthorized",
        log: e?.message ? e.message : "",
      };
    }
  }

  if (!authorize) {
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

    return { error: "Unauthorized" };
  }

  try {
    await config.storage.update(
      { k1, data: { pubkey, sig, success: true } },
      url,
      config
    );
  } catch (e) {
    if (config.flags.diagnostics && config.flags.logs) {
      console.warn(
        `An error occurred in the storage.update method. To debug the error see: ${
          config.baseUrl + config.apis.diagnostics
        }`
      );
    }
    return { error: "Default", log: e instanceof Error ? e.message : "" };
  }

  return {
    response: {
      status: "OK", // important status, confirms to wallet that auth was success
      success: true,
      k1,
    },
  };
}
