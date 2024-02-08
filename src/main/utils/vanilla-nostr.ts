import { HardConfig } from "../config/index";

declare global {
  interface Window {
    nostr: any;
  }
}

export const vanilla = function ({
  hardConfig,
  query,
}: {
  hardConfig: HardConfig;
  query: { redirect_uri: string; state: string };
}) {
  let session: {
    k1: string;
    lnurl: string;
    createInterval: number;
  } | null;
  let createIntervalId: NodeJS.Timeout | undefined;
  let errorUrl: string | undefined;
  const callbackController = new AbortController();
  const createController = new AbortController();

  // cleanup when the hook unmounts of polling is successful
  function cleanup() {
    clearInterval(createIntervalId);
    callbackController.abort();
    createController.abort();
  }

  // redirect user to error page if something goes wrong
  function error(e: any) {
    console.error(e);
    if (errorUrl) {
      window.location.replace(errorUrl);
    }
  }

  // callback the api to authenticate the user
  function callback(event: any) {
    if (!session || !session.k1) throw new Error("missing k1");
    const k1 = session.k1;

    const params = new URLSearchParams({ event: JSON.stringify(event) });

    return fetch(hardConfig.apis.callback, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "default",
      signal: callbackController.signal,
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        console.log(d);
        if (d && d.success) {
          cleanup();
          let url = new URL(query.redirect_uri);
          url.searchParams.append("state", query.state);
          url.searchParams.append("code", k1);
          window.location.replace(url);
        }
      })
      .catch(function (e) {
        console.error(e);
      });
  }

  // create a new lnurl and inject content into dom
  function create() {
    const params = new URLSearchParams({ state: query.state });
    if (session && session.k1) {
      params.append("k1", session.k1);
    }
    return fetch(hardConfig.apis.create, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "default",
      signal: createController.signal,
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (d && d.error) {
          if (d.url) errorUrl = d.url;
          throw new Error(d.message || d.error);
        }

        session = d;
        if (!session || !session.k1) return;

        // show wrapper
        const wrapper = document.getElementById(hardConfig.ids.wrapper);
        if (wrapper) {
          wrapper.style.display = "block";
        }

        // hide loader
        const loading = document.getElementById(hardConfig.ids.loading);
        if (loading) {
          loading.style.display = "none";
        }

        const button = document.getElementById(hardConfig.ids.button);
        if (button) {
          button.addEventListener("click", function () {
            if (session && session.k1) {
              clearError();
              triggerExtension(session.k1);
            }
          });
        }

        triggerExtension(session.k1);

        createIntervalId = setInterval(create, session.createInterval);
      })
      .catch(function (e) {
        if (!createController.signal.aborted) {
          error(e);
        }
      });
  }

  function setError(message: string, retry: boolean = true) {
    const error = document.getElementById(hardConfig.ids.error);
    if (error) {
      error.textContent = message;
    }

    const details = document.getElementById(hardConfig.ids.details);
    if (details) {
      details.style.display = "block";
    }

    if (retry) {
      const button = document.getElementById(hardConfig.ids.button);
      if (button) {
        button.style.display = "flex";
      }
    }
  }

  function clearError() {
    const error = document.getElementById(hardConfig.ids.error);
    if (error) {
      error.textContent = "";
    }

    const details = document.getElementById(hardConfig.ids.details);
    if (details) {
      details.style.display = "none";
    }

    const button = document.getElementById(hardConfig.ids.button);
    if (button) {
      button.style.display = "none";
    }
  }

  function callWithTimeout(targetFunction: () => void, timeoutMs: number) {
    return new Promise((resolve, reject) => {
      Promise.race([
        targetFunction(),
        new Promise((resolve, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "timeouted after " + timeoutMs + " ms waiting for extension"
                )
              ),
            timeoutMs
          )
        ),
      ])
        .then(resolve)
        .catch(reject);
    });
  }

  async function triggerExtension(k1: string) {
    if (!window.nostr) {
      setError("nostr extension not found", false);
      return;
    }
    try {
      // have them sign a message with the challenge
      let event;
      try {
        event = await callWithTimeout(
          () =>
            window.nostr.signEvent({
              kind: 22242,
              created_at: Math.floor(Date.now() / 1000),
              tags: [["challenge", k1]],
              content: "Authentication",
            }),
          5000
        );
        if (!event) throw new Error("extension returned empty event");
      } catch (e) {
        const message = e instanceof Error ? e.message : null;
        if (message === "window.nostr call already executing") {
          return;
        }
        setError("nostr extension failed to sign event");
        return;
      }

      await callback(event);
    } catch (e) {
      console.log("nostr auth error", e);
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    }
  }

  // setup intervals and create first qr code
  create();
};
