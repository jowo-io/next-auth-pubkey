import {
  boolean,
  int,
  index,
  mysqlTable,
  varchar,
  timestamp,
} from "drizzle-orm/mysql-core";

export const pubkeyTable = mysqlTable(
  "pubkey",
  {
    id: int("id").primaryKey().autoincrement().notNull(),
    state: varchar("state", { length: 255 }).notNull(),
    k1: varchar("k1", { length: 255 }).notNull(),
    pubkey: varchar("pubkey", { length: 255 }),
    sig: varchar("sig", { length: 255 }),
    success: boolean("success").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (pubkey) => ({
    stateIndex: index("pubkey__state__idx").on(pubkey.state),
    k1Index: index("pubkey__k1__idx").on(pubkey.k1),
  })
);

export type PubKey = typeof pubkeyTable.$inferSelect;
export type NewPubKey = typeof pubkeyTable.$inferInsert;
