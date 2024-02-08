import { HardConfig } from "../config/index";

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
    pollInterval: number;
    createInterval: number;
  } | null;
  let pollTimeoutId: NodeJS.Timeout | undefined;
  let createIntervalId: NodeJS.Timeout | undefined;
  let networkRequestCount: number = 0;
  let errorUrl: string | undefined;
  const pollController = new AbortController();
  const createController = new AbortController();
  const maxNetworkRequestsFailures = 3;

  // cleanup when the hook unmounts of polling is successful
  function cleanup() {
    clearTimeout(pollTimeoutId);
    clearInterval(createIntervalId);
    pollController.abort();
    createController.abort();
  }

  // redirect user to error page if something goes wrong
  function error(e: any) {
    console.error(e);
    if (errorUrl) {
      window.location.replace(errorUrl);
    }
  }

  // poll the api to see if the user has successfully authenticated
  function poll() {
    if (!session || !session.k1) return;
    const k1 = session.k1;

    const params = new URLSearchParams({ k1 });

    return fetch(hardConfig.apis.poll, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "default",
      signal: pollController.signal,
    })
      .then(function (r) {
        if (r.status === 410) {
          // if resource not found throw error immediately,
          // this means the user's auth session has been deleted.
          networkRequestCount = maxNetworkRequestsFailures;
        }
        return r.json();
      })
      .catch(function (e) {
        // if there are more than X network errors, then trigger redirect
        networkRequestCount++;
        if (networkRequestCount >= maxNetworkRequestsFailures) {
          // @ts-ignore
          pollTimeoutId = setTimeout(poll, session.pollInterval);
          throw e;
        }
      })
      .then(function (d) {
        if (d && d.error) {
          if (d.url) errorUrl = d.url;
          throw new Error(d.message || d.error);
        }

        if (d) networkRequestCount = 0;
        if (d && d.message) throw new Error(d.message);
        // @ts-ignore
        pollTimeoutId = setTimeout(poll, session.pollInterval);

        if (d && d.success) {
          cleanup();
          let url = new URL(query.redirect_uri);
          url.searchParams.append("state", query.state);
          url.searchParams.append("code", k1);
          window.location.replace(url);
        }
      })
      .catch(function (e) {
        if (!pollController.signal.aborted) {
          error(e);
        }
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
        if (!session || !session.lnurl) return;

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

        // inject copy text
        const copy = document.getElementById(hardConfig.ids.copy);
        if (copy) {
          copy.textContent = session.lnurl;
        }

        // inject qr src
        const qr = document.getElementById(
          hardConfig.ids.qr
        ) as HTMLImageElement;
        if (qr) {
          qr.src = hardConfig.apis.qr + "/" + session.lnurl;
          qr.onerror = error.bind(
            undefined,
            new Error("Failed to load QR code")
          );
        }

        // inject button href
        const button = document.getElementById(
          hardConfig.ids.button
        ) as HTMLAnchorElement;
        if (button) {
          button.href = `lightning:${session.lnurl}`;
        }

        pollTimeoutId = setTimeout(poll, session.pollInterval);
        createIntervalId = setInterval(create, session.createInterval);
      })
      .catch(function (e) {
        if (!createController.signal.aborted) {
          error(e);
        }
      });
  }

  // setup intervals and create first qr code
  create();
};
