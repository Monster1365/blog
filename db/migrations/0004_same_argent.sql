CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"title" text,
	"short_title" text,
	"description" text,
	"tagline" text,
	"hero_image" text,
	"favicon" text,
	"about" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
