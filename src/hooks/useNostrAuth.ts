"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

import { hardConfig } from "../main/config/hard";
import { cleanParams } from "../main/utils/params";

/**
 * A React hook that, on mount, will trigger an API request and create a new Nostr auth session.
 * Thereafter, it'll attempt to open any installed Nostr extensions, or thrown an error.
 * Once a success Nostr extension event is received from the extension the user will be
 * redirected to the `next-auth` redirect url.
 *
 * This hook is designed for use in the pages router, it's not recommended for use in the app router.
 *
 * @returns {Object}
 * @returns {Object}
 * @returns {Boolean} isLoading - signifies if the session is loading or not
 * @returns {String} error - an error message or an empty string
 * @returns {Function} retry - a function used to retry opening the nostr extension
 */
export function useNostrAuth(): {
  isLoading: boolean;
  error: string | null;
  retry: (() => void) | null;
} {
  const retryRef = useRef<(() => void) | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRetry, setRetry] = useState(true);
  const router = useRouter();

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
    let errorUrl: string | undefined;
    const callbackController = new AbortController();
    const createController = new AbortController();

    // cleanup when the hook unmounts of callbacking is successful
    const cleanup = () => {
      callbackController.abort();
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

    // callback the api to authenticate the user
    function callback(event: any) {
      if (!session?.k1) return;
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
          if (d && d.success) {
            cleanup();
            let url = new URL(redirectUri);
            url.searchParams.append("state", state);
            url.searchParams.append("code", k1);
            router.replace(url);
          }
        })
        .catch((e) => {
          if (!callbackController.signal.aborted) {
            error(e);
          }
        });
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
                    "timed out after " + timeoutMs + " ms waiting for extension"
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

    // trigger the nostr extension / handle errors on failure
    function triggerExtension(k1: string) {
      if (!window.nostr) {
        setRetry(false);
        setError("nostr extension not found");
        return;
      } else {
        setRetry(false);
        setError("");
      }

      return callWithTimeout(
        () =>
          window.nostr.signEvent({
            kind: 22242,
            created_at: Math.floor(Date.now() / 1000),
            tags: [["challenge", k1]],
            content: "Authentication",
          }),
        5000
      )
        .then((event) => {
          if (event) {
            callback(event);
          } else {
            setRetry(true);
            setError("extension returned empty event");
          }
        })
        .catch((e) => {
          const message =
            e instanceof Error
              ? e.message
              : "nostr extension failed to sign event";
          if (message === "window.nostr call already executing") {
            return;
          }
          setRetry(true);
          setError(message);
        });
    }

    // create a new k1 and set it to state
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
          retryRef.current = () => triggerExtension(d.k1);
          retryRef.current();
          setLoading(false);
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

  return {
    isLoading,
    error,
    retry: isRetry && error ? () => retryRef?.current?.() : null,
  };
}
