# About

A light-weight Lightning and Nostr auth provider for your Next.js app that's entirely self-hosted, meaning no 3rd party API keys required, and plugs seamlessly into the [next-auth](https://github.com/nextauthjs/next-auth) framework.

> ℹ️ This package is built for Next.js apps that use [next-auth](https://github.com/nextauthjs/next-auth). It's not compatible with other authentication libraries.

# How it works

Install the package, add two code snippets to your app (as shown below). It's that simple.

Your users will then be shown an additional authentication option in the provider list on the `next-auth` sign in page. When they click the new option they'll be presented with a QR code. The QR code can be scanned with any Bitcoin Lightning wallet that supports [lnurl-auth](https://fiatjaf.com/e0a35204.html). After scanning, they'll be securely logged in! No usernames, no passwords and no third party providers required.

The `next-auth-pubkey` package extends `lnurl-auth` by wrapping it in an OAuth API. `lnurl-auth` is used to authenticate your users, and OAuth is wrapped around it to make integration with `next-auth` seamless.

# Compatibility

```json
{
  "engines": {
    "node": ">=14"
  },
  "peerDependencies": {
    "next": "^12.2.5 || ^13 || ^14",
    "next-auth": "^4",
    "react": "^17.0.2 || ^18",
    "react-dom": "^17.0.2 || ^18"
  }
}
```

# Getting started

### Install

```bash
npm i next-auth-pubkey
```

### .env

You'll need to setup a couple of env vars in your project's `.env` file. However, you may already have them defined as part of your `next-auth` configuration.

---

The `NEXTAUTH_URL` env var must be defined as the canonical URL of your site.

```bash
NEXTAUTH_URL="http://localhost:3000"
```

---

The `NEXTAUTH_SECRET` env var must be defined as a securely generated random string.

```bash
NEXTAUTH_SECRET="<super-secret-random-string>"
```

You can quickly create a good value for `NEXTAUTH_SECRET` on the command line via this `openssl` command.

```bash
openssl rand -base64 32
```

### API

Create a new API route under `pages/api/pubkey/[...pubkey].ts`

This API will handle all of the pubkey auth API requests, such as generating QRs, handling callbacks, polling and issuing JWT auth tokens.

```typescript
// @/pages/api/pubkey/[...pubkey].ts

import NextAuthPubkey, { NextAuthPubkeyConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";

const config: NextAuthPubkeyConfig = {
  baseUrl: process.env.NEXTAUTH_URL,
  secret: process.env.NEXTAUTH_SECRET,
  storage: {
    async set({ k1, session }) {
      // save lnurl auth session data based on k1 id
    },
    async get({ k1 }) {
      // lookup and return lnurl auth session data based on k1 id
    },
    async update({ k1, session }) {
      // update lnurl auth session data based on k1 id
    },
    async delete({ k1 }) {
      // delete lnurl auth session data based on k1 id
    },
  },
  generateQr,
};

const { lightningProvider, nostrProvider, handler } = NextAuthPubkey(config);

export { lightningProvider, nostrProvider };

export default handler;
```

> ℹ️ The above example uses the Pages Router. If your app uses the App Router then take a look at the [examples/app-router/](https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/app-router/) example app.

### Provider

In your existing `pages/api/auth/[...nextauth].ts` config file, import and add the pubkey providers to the providers array.

```typescript
// @/pages/api/auth/[...nextauth].ts

import { lightningProvider, nostrProvider } from "../pubkey/[...pubkey]"; // <--- import the providers from the pubkey API route

export const authOptions: AuthOptions = {
  providers: [
    lightningProvider, // <--- add the provider to the providers array
    nostrProvider, //     <--- add the provider to the providers array
  ],
};

export default NextAuth(authOptions);
```

# Generators

If you were to authenticate a user with only `lnurl-auth`, all you'd know about them is their unique ID (a `pubkey`).

The `next-auth-pubkey` package goes a step further and provides an optional feature for deterministically (the `pubkey` can be used as a seed) generate avatars and usernames. This means you can show users a unique name and image that'll be associated with their account.

As well as the optional avatar and image generators, there's also a required QR code generator.

See the `generateQr`, `generateAvatar` & `generateName` functions in the config section below.

> Once you have configured the generator functions you can launch your dev server and test them locally on the diagnostics page:

```
http://localhost:3000/api/pubkey/diagnostics
```

# Configuration

There are various configurations available to you. Some are required, some are optional.

###

```typescript
const config: NextAuthPubkeyConfig = {
  /**
   * @param {string} baseUrl
   *
   * Must be defined as the canonical URL of your site. It's used in
   * various places under the hood, such as for generating callback URLs and
   * in the headers of JWT tokens that are issued to logged in user.
   */
  baseUrl: process.env.NEXTAUTH_URL,

  /**
   * @param {string} secret
   *
   * Must be defined as a securely generated random string. Used to sign the
   * JWT token that authenticates users who have logged in.
   */
  secret: process.env.NEXTAUTH_SECRET,

  /**
   * @param {object} storage
   *
   * pubkey auth flows require that a callback be triggered
   * part of the authentication flow. So, we require session storage to
   * persist some data and ensure it's available when the callback is triggered.
   * Data can be stored in a medium of your choice.
   *
   * Once you have configured the storage functions you should test them on the diagnostics page:
   * @see http://localhost:3000/api/pubkey/diagnostics
   *
   * @see https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/
   */
  storage: {
    /**
     * @param {function} set
     *
     * An async function that receives a k1 and a data argument.
     * The k1 is a unique key that's used to store the
     * data for later use.
     */
    async set({ k1, session }) {
      // save lnurl auth session data based on k1 id
    },

    /**
     * @param {function} get
     *
     * An async function that receives a k1 argument.
     * The k1 is a unique key that's used to find
     * and return data previously stored under it.
     */
    async get({ k1 }) {
      // lookup and return lnurl auth session data based on k1 id
    },

    /**
     * @param {function} update
     *
     * An async function that receives a k1 and a data argument.
     * The k1 is a unique key that's used to find and
     * update data previously stored under it.
     *
     * @note the storage.update method should throw an error if
     * an existing session is not already stored under the k1.
     */
    async update({ k1, session }) {
      // update lnurl auth session data based on k1 id
    },

    /**
     * @param {function} delete
     *
     * An async function that receives a k1 argument.
     * The k1 is a unique key that's used to find and
     * delete data previously saved data.
     */
    async delete({ k1 }) {
      // delete lnurl auth session data based on k1 id
    },
  },

  /**
   * @param {function} generateQr
   *
   * Define the QR code generator function.
   * It must return a base64 encoded png/jpg OR svg XML markup.
   *
   * A default QR code generator is provided. It can be imported from:
   * import generateQr from "next-auth-pubkey/generators/qr";
   *
   * the default library used is:
   * @see https://www.npmjs.com/package/qrcode
   */
  async generateQr(data, config) {
    return {
      data: "data:image/png;base64,iVBO.....CYII=",
      type: "png",
      // or
      data: "<svg>.....</svg>",
      type: "svg",
    };
  },

  // optional
  pages: {
    /**
     * @param {string} lightningSignIn
     *
     * A Lightning auth page will be automatically generated unless the
     * `lightningSignIn` path is specified. It lets you define your own page where
     * you can configure a custom Next.js page and customize the UI.
     *
     * @note the path must begin with a leading `/`. For example, `/signin`, not `signin`.
     *
     * @see https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/ui-pages-router/
     * and
     * @see https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/ui-app-router/
     *
     * @default "/api/pubkey/lightning-signin"
     */
    lightningSignIn: "/example-custom-lightning-signin",

    /**
     * @param {string} nostrSignIn
     *
     * A nostr auth page will be automatically generated unless the
     * `nostrSignIn` path is specified. It lets you define your own page where
     * you can configure a custom Next.js page and customize the UI.
     *
     * @note the path must begin with a leading `/`. For example, `/signin`, not `signin`.
     *
     * @see https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/ui-pages-router/
     * and
     * @see https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/ui-app-router/
     *
     * @default "/api/pubkey/nostr-signin"
     */
    nostrSignIn: "/example-custom-nostr-signin",

    /**
     * @param {string} error
     *
     * By default users will be redirected to the `next-auth` error page
     * and shown an error message there. If you want a custom error page,
     * you can define a custom path.
     *
     * @note the path must begin with a leading `/`. For example, `/error`, not `error`.
     *
     * @see https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/ui-pages-router/
     * and
     * @see https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/ui-app-router/
     *
     * @default "/api/auth/error"
     */
    error: "/example-custom-error",
  },

  /**
   * @param {function} generateAvatar
   *
   * Define an avatar generator function if you want to assign random names to your pubkey users.
   *
   * It must return a base64 encoded png/jpg OR svg XML markup.
   */
  async generateAvatar(pubkey) {
    // import { createAvatar } from "@dicebear/core";
    // import { bottts } from "@dicebear/collection";
    return {
      data: createAvatar(bottts, { seed: pubkey }).toString(),
      type: "svg",
    };
  },

  /**
   * @param {function} generateName
   *
   * Define a name generator function if you want to assign random names to your pubkey users.
   */
  async generateName(pubkey) {
    // import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
    return {
      name: uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: "-",
        pubkey,
      }),
    };
  },

  /**
   * Feature flags.
   */
  flags: {
    /**
     * @param {string} diagnostics
     *
     * Toggle on / off the diagnostics page found at:
     * http://localhost:3000/api/pubkey/diagnostics
     *
     * @default enabled for development build only
     */
    diagnostics: true | false,

    /**
     * @param {string} logs
     *
     * Toggle on / off the logging of console errors.
     *
     * @default enabled for development build only
     */
    logs: true | false,
  },

  /**
   * Control the color scheme of the "Login with ..." page and button.
   */
  theme: {
    /**
     * @param {string} colorScheme
     *
     * Define a color scheme for the "Login with ..." UI.
     *
     * @default "light"
     */
    colorScheme: "light" | "dark",

    /**
     * @param {string} background
     *
     * Override the theme's background color.
     *
     * @default light "#ececec"
     * @default dark "#161b22"
     */
    background: "#00ffff",

    /**
     * @param {string} backgroundCard
     *
     * Override the theme's main content card background color.
     *
     * @default light "#ffffff"
     * @default dark "#0d1117"
     */
    backgroundCard: "#ffff00",

    /**
     * @param {string} text
     *
     * Override the theme's main text color.
     *
     * @default light "#000000"
     * @default dark "#ffffff"
     */
    text: "#0000ff",

    /**
     * @param {string} signInButtonBackground
     *
     * Override the background color of the sign in button.
     * This is the button that's shown in the provider list on the
     * `next-auth` sign in page alongside your other providers.
     *
     * @default light "#24292f"
     * @default dark "#24292f"
     */
    signInButtonBackground: "#00ff00",

    /**
     * @param {string} signInButtonText
     *
     * Override the text color of the sign in button.
     * This is the button that's shown in the provider list on the
     * `next-auth` sign in page alongside your other providers.
     *
     * @default light "#ffffff"
     * @default dark "#ffffff"
     */
    signInButtonText: "#ff00ff",

    /**
     * @param {object} qrBackground
     *
     * Override the theme's QR code background color.
     *
     * @default light "#ffffff"
     * @default dark "#0d1117"
     */
    qrBackground: "#ff0000",

    /**
     * @param {object} qrForeground
     *
     * Override the theme's QR code foreground color.
     *
     * @default light "#ffffff"
     * @default dark "#0d1117"
     */
    qrForeground: "#0000ff",

    /**
     * @param {number} qrMargin
     *
     * Override the theme's QR code margin value.
     * Scale factor. A value of `1` means 1px per modules (black dots).
     *
     * @default light 0
     * @default dark 0.5
     */
    qrMargin: 1,
  },

  /**
   * Control interval durations.
   */
  intervals: {
    /**
     * @param {number} poll
     *
     * Override the poll interval to increase or decrease the speed at which
     * API polling occurs on the QR Login page. If decreased, the login page will
     * feel more responsive. If increased, the user may be waiting a bit longer
     * before being redirected after a successful login.
     *
     * @min 500 ms (0.5 seconds)
     * @max 5,000 (5 seconds)
     *
     * @default 1,000 ms (1 second)
     */
    poll: 500,

    /**
     * @param {number} create
     *
     * Override the create interval to increase or decrease the speed at which
     * QR codes are refreshed at.
     *
     * @min 30,000 ms (30 seconds)
     * @max 3,600,000 ms (1 hour)
     *
     * @default 300,000 ms (5 minutes)
     */
    create: 30 * 1000,
  },
};
```

# Storage

pubkey auth flows require that a callback be triggered on success as part of the authentication flow. For this reason, it may be that the device scanning the QR (e.g. a mobile) is not the same device that's trying to authenticate (e.g. a desktop). So, we require session storage to persist some data and make it available across devices and ensure it's available when the callback is triggered.

Data can be stored in a medium of your choice. For example: a database, a document store, or a session store. Here's an example using [Vercel KV](https://vercel.com/docs/storage/vercel-kv):

```typescript
import { kv } from "@vercel/kv";

const config: NextAuthPubkeyConfig = {
  // ...
  storage: {
    async set({ k1, session }) {
      await kv.set(`k1:${k1}`, session);
    },
    async get({ k1 }) {
      return await kv.get(`k1:${k1}`);
    },
    async update({ k1, session }) {
      const old = (await kv.get(`k1:${k1}`)) || {};
      await kv.set(`k1:${k1}`, { ...old, ...session });
    },
    async delete({ k1 }) {
      await kv.del(`k1:${k1}`);
    },
  },
  // ...
};
```

See more working examples in the [examples/](https://github.com/jowo-io/next-auth-pubkey/tree/main/examples) folder.

Once you have configured the storage functions you can launch your dev server and test them locally on the diagnostics page:

```
http://localhost:3000/api/pubkey/diagnostics
```

On the diagnostic page you can optionally pass in your own custom session values via query param:

```
http://localhost:3000/api/pubkey/diagnostics?k1=custom-k1&state=custom-state&pubkey=custom-pubkey&sig=custom-sig
```

> ℹ️ The diagnostics page will be **disabled** by default for production builds. To enable on production see the `flags` config options.

### Error page

By default users are sent to the default `next-auth` error page and a generic error message is shown.

The error page path can be overridden and a custom error page can be configured (See the `pages` config options).

If you define a custom error page, the following error codes are passed in via query param:

```typescript
enum ErrorCodes {
  // An attempted API request was made to an auth endpoint while already logged in.
  Forbidden = "You are already logged in.",

  // An API request was made to a non existent `lnurl-auth` API path.
  NotFound = "Path not found.",

  // Authorizing the user failed because the `lnurl-auth` callback received an invalid `signature` / `pubkey`
  Unauthorized = "You could not be signed in.",

  // The user's session has been deleted. Either their session expired or they had a failed sign in attempt and must create a new session.
  Gone = "Session not found.",

  // An API request was made to the `lnurl-auth` APIs with a missing required query param or body arguments.
  BadRequest = "Missing required query or body arguments.",

  // Generic catch-all error code when one of the above errors is not matched.
  Default = "Unable to sign in.",
}
```

Example: `/error?error=Default&message=Unable+to+sign+in.`

# Next.js Routers

With the release of `next@v13` comes the App Router.

This package supports both the [Pages Router](https://nextjs.org/docs/pages) and the [App Router](https://nextjs.org/docs/app).

If your app uses the App Router, see the [examples/app-router/](https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/app-router/) app.

If your app uses the Pages Router, see the other apps in the [examples/](https://github.com/jowo-io/next-auth-pubkey/tree/main/examples/) folder.

# Examples

See working examples in the [examples/](https://github.com/jowo-io/next-auth-pubkey/tree/main/examples) folder.

# Diagram

Here's a diagram illustrating what's happening under the hood during the Lightning OAuth authorization flow:

![diagram of Lightning OAuth authorization flow](https://github.com/jowo-io/next-auth-pubkey/blob/main/diagram.jpeg?raw=true)

# Contributing

If you would like to contribute to this project, please open an [issue](https://github.com/jowo-io/next-auth-pubkey/issues) before making a pull request.

# Sponsors

Many thanks to [OpenSats](https://opensats.org/) for funding the development of this project!

![OpenSats card](https://opensats.org/static/images/twitter.png)

# License

**ISC**
