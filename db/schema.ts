import {boolean, integer, jsonb, pgTable, text} from "drizzle-orm/pg-core";
import {InferModel} from "drizzle-orm";
import {User} from "@/types/user";


export const spaces = pgTable('space', {
    key: text("key").primaryKey(),
    version: integer("version").notNull(),
})

export const replicacheClients = pgTable('replicache_client', {
    id: text("id").primaryKey(),
    last_mutation_id: integer("last_mutation_id").notNull()
})


export const entities = pgTable('entities', {
    id: text("key").primaryKey(),
    space_id: text("space_id").notNull().references(() => spaces.key),
    type: text("type").notNull(),
    data: jsonb("data").$type<User>().notNull(),
    deleted: boolean("deleted").notNull(),
    version: integer("version").notNull(),
});

export type Entity = InferModel<typeof entities>;

