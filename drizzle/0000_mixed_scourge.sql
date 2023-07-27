CREATE TABLE IF NOT EXISTS "entities" (
	"key" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"deleted" boolean NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "replicache_client" (
	"id" text PRIMARY KEY NOT NULL,
	"last_mutation_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "space" (
	"key" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "entities" ADD CONSTRAINT "entities_space_id_space_key_fk" FOREIGN KEY ("space_id") REFERENCES "space"("key") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
