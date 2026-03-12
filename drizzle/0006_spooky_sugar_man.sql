CREATE TABLE "observation_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_id" uuid,
	"user_id" uuid,
	"vote" text NOT NULL,
	"comment" text,
	"suggested_species_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "observation_votes" ADD CONSTRAINT "observation_votes_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_votes" ADD CONSTRAINT "observation_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observation_votes" ADD CONSTRAINT "observation_votes_suggested_species_id_species_id_fk" FOREIGN KEY ("suggested_species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;