import {
  boolean,
  int,
  index,
  mysqlTable,
  varchar,
  timestamp,
} from "drizzle-orm/mysql-core";

export const lnAuthTable = mysqlTable(
  "lnauth",
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
  (lnAuth) => ({
    stateIndex: index("lnauth__state__idx").on(lnAuth.state),
    k1Index: index("lnauth__k1__idx").on(lnAuth.k1),
  })
);

export type LnAuth = typeof lnAuthTable.$inferSelect;
export type NewLnAuth = typeof lnAuthTable.$inferInsert;
