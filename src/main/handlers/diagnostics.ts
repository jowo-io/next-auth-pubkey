import { randomBytes } from "crypto";

import { Config, StorageData } from "../config/types";
import { HandlerArguments, HandlerReturn } from "../utils/handlers";

type Check = {
  state: "success" | "failed";
  method: "get" | "set" | "update" | "delete" | null;
  message: string;
};

export function testField(
  received: StorageData | null | undefined,
  expected: StorageData | null | undefined,
  field: "k1" | "state" | "pubkey" | "sig" | "success"
): Check {
  const state = received?.[field] !== expected?.[field] ? "failed" : "success";
  return {
    state,
    method: "get",
    message: `Expected 'session.${field}' to be '${expected?.[field]}', received '${received?.[field]}'.`,
  };
}

export async function testSet(
  setMethod: () => Promise<undefined>,
  config: Config
): Promise<Check[]> {
  const checks: Check[] = [];
  try {
    await setMethod();
    checks.push({
      state: "success",
      method: "set",
      message: "Invoked without throwing an error.",
    });

    return checks;
  } catch (e) {
    if (config.flags.logs) {
      console.error(e);
    }
    checks.push({
      state: "failed",
      method: "set",
      message: "An unexpected error occurred.",
    });
    return checks;
  }
}

export async function testGet(
  expectedSession: { k1: string; state: string },
  getMethod: () => Promise<StorageData | null | undefined>,
  config: Config
): Promise<Check[]> {
  const checks: Check[] = [];

  try {
    const receivedSession = await getMethod();
    checks.push({
      state: "success",
      method: "get",
      message: "Invoked without throwing an error.",
    });

    if (!receivedSession) {
      checks.push({
        state: "failed",
        method: "get",
        message: "Session data not defined.",
      });
      return checks;
    }
    checks.push(testField(receivedSession, expectedSession, "k1"));
    checks.push(testField(receivedSession, expectedSession, "state"));

    return checks;
  } catch (e) {
    if (config.flags.logs) {
      console.error(e);
    }
    checks.push({
      state: "failed",
      method: "get",
      message: "An unexpected error occurred.",
    });
    return checks;
  }
}

export async function testUpdate(
  expectedSession: { k1: string; state: string },
  updateMethod: (override?: string) => Promise<undefined>,
  getMethod: () => Promise<StorageData | null | undefined>,
  config: Config
): Promise<Check[]> {
  const checks: Check[] = [];
  try {
    const rand = randomBytes(20).toString("hex").toUpperCase();
    await updateMethod(`NON_EXISTING_K1_${rand}_NON_EXISTING_K1`);
    if (config.flags.logs) {
      console.error(
        new Error(
          "The storage.update method should throw an error if an existing session is not already stored under the k1."
        )
      );
    }
    checks.push({
      state: "failed",
      method: "update",
      message:
        "Invoked on a non-existing k1 without throwing. Expected an error to be thrown when session doesn't exist.",
    });
    return checks;
  } catch (e) {
    checks.push({
      state: "success",
      method: "update",
      message: "Invoked on a non-existing k1 and threw an error.",
    });
  }
  try {
    await updateMethod();
    checks.push({
      state: "success",
      method: "update",
      message: "Invoked on existing k1 without throwing an error.",
    });

    let receivedSession;
    try {
      receivedSession = await getMethod();
    } catch (e) {
      if (config.flags.logs) {
        console.error(e);
      }
      checks.push({
        state: "failed",
        method: "get",
        message: "An unexpected error occurred.",
      });
      return checks;
    }

    if (!receivedSession) {
      checks.push({
        state: "failed",
        method: "get",
        message: "Session data not found.",
      });
      return checks;
    }
    checks.push(testField(receivedSession, expectedSession, "k1"));
    checks.push(testField(receivedSession, expectedSession, "state"));
    checks.push(testField(receivedSession, expectedSession, "pubkey"));
    checks.push(testField(receivedSession, expectedSession, "sig"));
    checks.push(testField(receivedSession, expectedSession, "success"));

    return checks;
  } catch (e) {
    if (config.flags.logs) {
      console.error(e);
    }
    checks.push({
      state: "failed",
      method: "update",
      message: "An unexpected error occurred.",
    });
    return checks;
  }
}

export async function testDelete(
  deleteMethod: () => Promise<undefined>,
  getMethod: () => Promise<StorageData | null | undefined>,
  config: Config
): Promise<Check[]> {
  const checks: Check[] = [];

  try {
    await deleteMethod();

    checks.push({
      state: "success",
      method: "delete",
      message: "Invoked without throwing an error.",
    });

    let receivedSession;
    try {
      receivedSession = await getMethod();
    } catch (e) {
      if (config.flags.logs) {
        console.error(e);
      }
      checks.push({
        state: "failed",
        method: "get",
        message: "An unexpected error occurred.",
      });
      return checks;
    }

    if (receivedSession) {
      checks.push({
        state: "failed",
        method: "delete",
        message: "Session data was not deleted.",
      });
      return checks;
    }

    checks.push({
      state: "success",
      method: "delete",
      message: "Session data was deleted.",
    });
    return checks;
  } catch (e) {
    if (config.flags.logs) {
      console.error(e);
    }
    checks.push({
      state: "failed",
      method: "delete",
      message: "An unexpected error occurred.",
    });
    return checks;
  }
}

export default async function handler({
  query,
  cookies,
  url,
  config,
}: HandlerArguments): Promise<HandlerReturn> {
  const checks: Check[] = [];

  const k1 =
    typeof query?.k1 === "string" ? query.k1 : randomBytes(6).toString("hex");
  const state =
    typeof query?.state === "string"
      ? query.state
      : randomBytes(6).toString("hex");
  const pubkey =
    typeof query?.pubkey === "string"
      ? query.pubkey
      : randomBytes(6).toString("hex");
  const sig =
    typeof query?.sig === "string" ? query.sig : randomBytes(6).toString("hex");
  const qr =
    typeof query?.qr === "string" ? query.qr : randomBytes(32).toString("hex");

  try {
    const setSession = { k1, state };
    const updateSession = { pubkey, sig, success: true };

    const setMethod = async () =>
      await config.storage.set({ k1, data: setSession }, url, config);
    const getMethod = async () => await config.storage.get({ k1 }, url, config);
    const updateMethod = async (override?: string) =>
      await config.storage.update(
        { k1: override || k1, data: updateSession },
        url,
        config
      );
    const deleteMethod = async () =>
      await config.storage.delete({ k1 }, url, config);

    // set
    checks.push(...(await testSet(setMethod, config)));

    // get
    checks.push(...(await testGet(setSession, getMethod, config)));

    // update
    checks.push(
      ...(await testUpdate(
        { ...setSession, ...updateSession },
        updateMethod,
        getMethod,
        config
      ))
    );

    // delete
    checks.push(...(await testDelete(deleteMethod, getMethod, config)));

    // generic throw
  } catch (e) {
    if (config.flags.logs) {
      console.error(e);
    }
    checks.push({
      state: "failed",
      method: null,
      message: "Something went wrong running diagnostics.",
    });
  }

  let name = null;
  try {
    if (config.generateName) {
      name = (await config.generateName(pubkey, config))?.name;
      if (!name) throw new Error();
    }
  } catch (e) {
    name = `<div class="empty">Failed to load</div>`;
  }

  const generators = {
    generateQr: `<img onerror="handleError(this)" src="${
      config.baseUrl + config.apis.qr + "/" + qr
    }" width="200px" height="200px" />`,
    generateAvatar: config.generateAvatar
      ? `<img onerror="handleError(this)" src="${
          config.baseUrl + config.apis.avatar + "/" + pubkey
        }" width="200px" height="200px" />`
      : null,
    generateName: name ? `<div class="name"><span>${name}</span></div>` : null,
  };

  return {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
    response: `<!DOCTYPE html><html lang="en">
  <head>
    <meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostics</title>
    <style>
      body {
        display: flex;
        justify-content: center;
        font-family: ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;
      }
      .check {
        display: flex;
        margin: 10px 0;
        min-width: 900px;
      }
      .state {
        min-width:110px
      }
      .state-failed {
        color: red;
      }
      .state-success {
        color: green;
      }
      .method {
        font-weight: bold;
        min-width:150px
      }
      .message {
      }
      .generators {
        text-align: center;
        display: flex;
        justify-content: center;
        gap: 10px;
      }
      .name {
        background-color: #888888;
        color: #eeeeee;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
        padding: 10px;
        box-sizing: border-box;
      }
      .missing {
        background-color: orange;
        color: #eeeeee;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
        padding: 10px;
        box-sizing: border-box;
      }
      .empty {
        background-color: red;
        color: #eeeeee;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
        padding: 10px;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div>
      <div class="check">
        <span class="state"><b>Status</b></span>
        <span class="method"><b>Method</b></span>
        <span class="message"><b>Message</b></span>
      </div>
      <hr/>
      ${checks
        .map(
          ({ state, method, message }) =>
            `<div class="check">
              <span class="state state-${state}">${state.toUpperCase()}</span>
              <span class="method">${
                method ? `storage.${method}` : "unknown"
              }</span>
              <span class="message">${message}</span>
            </div>`
        )
        .join("")}
        <hr/>

      <div class="generators">
        ${Object.entries(generators)
          .map(([key, value]) => {
            return `
            <div id="${key}">
              <pre>${key}</pre>
              ${value ? value : `<div class="missing">Not defined</div>`}
            </div>`;
          })
          .join("")}
      </div>
    </div>
    <script>
      function handleError(target){
        const a = document.createElement("span");
        a.className = "empty"
        a.textContent = "Failed to load"
        target.replaceWith(a);
      }
    </script>
  </body>
  </html>`,
  };
}
