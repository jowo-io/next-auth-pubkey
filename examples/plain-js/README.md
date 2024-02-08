## About

This example demonstrates how to configure `next-auth-pubkey` in a plain JavaScript app (without TypeScript).

> ⚠️ WARNING using `node-persist` is not recommended in lambda or edge environments.
>
> The reason not to use `node-persist` is that it stores session data locally in files, and in most lambda / cloud environments those files will not persist across invocations.
>
> Instead you should use persistent storage such as a database, a document store, or session storage.
>
> See the other examples in the examples folder for more info.

## Getting Started

#### Building `next-auth-pubkey`

Before you can run this example locally, you must clone and build `next-auth-pubkey`.

Essentially all that's required is running `npm i` and `npm run build` from the directory root.

#### Create env vars

Along side the `.env.example` file in this example app, create a `.env` file with the same contents and fill all of the variables with real values.

#### Running this examples

Run `npm i` to install dependencies.

Run `npm run dev` to launch the dev server and visit `localhost:3000` to view the app.
