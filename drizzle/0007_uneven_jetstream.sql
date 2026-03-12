CREATE TABLE "mission_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_id" uuid,
	"user_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_count" integer DEFAULT 10,
	"current_count" integer DEFAULT 0,
	"image_url" text,
	"status" text DEFAULT 'active',
	"end_date" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "mission_messages" ADD CONSTRAINT "mission_messages_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_messages" ADD CONSTRAINT "mission_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;