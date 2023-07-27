import type { Config } from "drizzle-kit";
import {connectionString} from "./db";

export default {
    schema: "./db/schema.ts",
    driver: 'pg',
    dbCredentials: {
        connectionString: connectionString
    }
} satisfies Config;