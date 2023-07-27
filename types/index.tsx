import {PgTransaction} from "drizzle-orm/pg-core";
import {PostgresJsQueryResultHKT} from "drizzle-orm/postgres-js";
import {ExtractTablesWithRelations} from "drizzle-orm";


export type TxType = PgTransaction<PostgresJsQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>