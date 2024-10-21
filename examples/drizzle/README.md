## About

This example uses the [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) to connect to a MySql database which is used for storage of pubkey data.

## Getting Started

#### Building `next-auth-pubkey`

Before you can run this example locally, you must clone and build `next-auth-pubkey`.

Essentially all that's required is running `npm i` and `npm run build` from the directory root.

#### Create env vars

Along side the `.env.example` file in this example app, create a `.env` file with the same contents and fill all of the variables with real values.

#### Running this examples

Run `npm i` to install dependencies.

Run `npm run db:generate` to generate the new database schema.

Run the generated queries in your mysql environment of choice.

Run `npm run dev` to launch the dev server and visit `localhost:3000` to view the app.
