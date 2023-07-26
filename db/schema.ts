import {integer, pgTable, text} from "drizzle-orm/pg-core";


export const spaces = pgTable('space', {
    key: text("key").primaryKey(),
    version: integer("version").notNull(),
})


// export const messages = pgTable('message', {
//     id: text("key").primaryKey(),
//     sender: varchar("sender", {length: 256}).notNull(),
//     space_id: text("space_id").notNull().references(() => spaces.key),
//     content: text("content").notNull(),
//     ord: integer("ord").notNull(),
//     deleted: boolean("deleted").notNull(),
//     version: integer("version").notNull(),
// });
//
//
export const replicacheClients = pgTable('replicache_client', {
    id: text("id").primaryKey(),
    last_mutation_id: integer("last_mutation_id").notNull()
})
//
// export type NewMessage = InferModel<typeof messages>;

