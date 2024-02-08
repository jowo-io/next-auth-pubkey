import { pollValidation } from "../validation/api";
import { HandlerArguments, HandlerReturn } from "../utils/handlers";

export default async function handler({
  body,
  cookies,
  url,
  config,
}: HandlerArguments): Promise<HandlerReturn> {
  let k1;
  try {
    ({ k1 } = pollValidation.parse(body));
  } catch (e) {
    return { error: "BadRequest", log: e instanceof Error ? e.message : "" };
  }

  let session;
  try {
    session = await config.storage.get({ k1 }, url, config);
  } catch (e) {
    if (config.flags.diagnostics && config.flags.logs) {
      console.warn(
        `An error occurred in the storage.get get. To debug the error see: ${
          config.baseUrl + config.apis.diagnostics
        }`
      );
    }
    return { error: "Default", log: e instanceof Error ? e.message : "" };
  }

  if (!session) {
    return {
      error: "Gone",
      status: 410, // return a 410 status so the client knows the session no longer exists
    };
  }

  return {
    response: {
      success: session?.success || false,
    },
  };
}
