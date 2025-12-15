"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { hardConfig } from "../main/config/hard";
import { cleanParams } from "../main/utils/params";
import { formatLightningAuth } from "../utils/lnurl/format";
import { maxNetworkRequestsFailures } from "./constants";

/**
 * A React hook that, on mount, will trigger an API request and create a new Lightning auth session.
 * Thereafter, it'll poll the API and checks if the Lightning auth QR has been scanned.
 * If enough time elapses without a sign in attempt, the Lightning auth session will be refreshed.
 * Once a success status is received from polling, the user will be redirected to the `next-auth` redirect url.
 *
 * This hook is designed for use in the pages router, it's not recommended for use in the app router.
 *
 * @returns {Object}
 * @returns {String} lnurl - the raw LNURL, should be made available for copy-pasting
 * @returns {String} qr - a url pointing the lnurl-auth QR Code image, should be used in the src prop of img tags
 * @returns {String} button - a deep-link that will open in Lightning enabled wallets, should be used in the href prop of anchor tags
 */
export function useLightningAuth(): {
  lnurl: string;
  qr: string;
  button: string;
} {
  const router = useRouter();
  const [lnurl, setUrl] = useState<string>("");

  useEffect(() => {
    if (!router.isReady) return;
    const { state = "", redirect_uri: redirectUri = "" } = cleanParams(
      router.query
    );

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

    // cleanup when the hook unmounts of polling is successful
    const cleanup = () => {
      clearTimeout(pollTimeoutId);
      clearInterval(createIntervalId);
      pollController.abort();
      createController.abort();
    };

    // redirect user to error page if something goes wrong
    function error(e: any) {
      console.error(e);
      if (errorUrl) {
        router.replace(errorUrl);
      } else {
        // if no errorUrl exists send to defaul `next-auth` error page
        const params = new URLSearchParams();
        params.append("error", "OAuthSignin");
        router.replace(`/api/auth/error?${params.toString()}`);
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
        .then((r) => {
          if (r.status === 410) {
            // if resource not found throw error immediately,
            // this means the user's auth session has been deleted.
            networkRequestCount = maxNetworkRequestsFailures;
          }
          return r.json();
        })
        .catch((e) => {
          // if there are more than X network errors, then trigger redirect
          networkRequestCount++;
          if (networkRequestCount >= maxNetworkRequestsFailures) {
            pollTimeoutId = setTimeout(poll, session!.pollInterval);
            throw e;
          }
        })
        .then((d) => {
          if (d && d.error) {
            if (d.url) errorUrl = d.url;
            throw new Error(d.message || d.error);
          }
          if (!redirectUri || !state) throw new Error("Missing query params");

          if (d) networkRequestCount = 0;
          if (d && d.message) throw new Error(d.message);
          pollTimeoutId = setTimeout(poll, session!.pollInterval);

          if (d && d.success) {
            cleanup();
            let url = new URL(redirectUri);
            url.searchParams.append("state", state);
            url.searchParams.append("code", k1);
            router.replace(url);
          }
        })
        .catch((e) => {
          if (!pollController.signal.aborted) {
            error(e);
          }
        });
    }

    // create a new lnurl and set it to state
    function create() {
      const params = new URLSearchParams({ state });
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
        .then((r) => r.json())
        .then((d) => {
          if (d && d.error) {
            if (d.url) errorUrl = d.url;
            throw new Error(d.message || d.error);
          }

          session = d;
          if (!session) return;

          // setup intervals and create first qr code
          pollTimeoutId = setTimeout(poll, session?.pollInterval);
          createIntervalId = setInterval(create, session?.createInterval);

          setUrl(session.lnurl);
        })
        .catch((e) => {
          if (!createController.signal.aborted) {
            error(e);
          }
        });
    }

    create();

    return () => cleanup();
  }, [router.isReady]);

  const { qr, button } = formatLightningAuth(lnurl);

  return {
    lnurl,
    qr,
    button,
  };
}
