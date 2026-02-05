CREATE TABLE `api_tokens` (
	`id` integer PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`access_token` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_tokens_provider_unique` ON `api_tokens` (`provider`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_media_stats_history` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`time_spent` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`active` integer NOT NULL,
	`total_entries` integer DEFAULT 0 NOT NULL,
	`total_redo` integer DEFAULT 0 NOT NULL,
	`entries_rated` integer DEFAULT 0 NOT NULL,
	`sum_entries_rated` integer DEFAULT 0 NOT NULL,
	`entries_commented` integer DEFAULT 0 NOT NULL,
	`entries_favorites` integer DEFAULT 0 NOT NULL,
	`total_specific` integer DEFAULT 0 NOT NULL,
	`status_counts` text DEFAULT '{}' NOT NULL,
	`average_rating` real,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`media_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_media_stats_history`("id", "user_id", "media_type", "time_spent", "views", "active", "total_entries", "total_redo", "entries_rated", "sum_entries_rated", "entries_commented", "entries_favorites", "total_specific", "status_counts", "average_rating", "timestamp", "media_id") SELECT "id", "user_id", "media_type", "time_spent", "views", "active", "total_entries", "total_redo", "entries_rated", "sum_entries_rated", "entries_commented", "entries_favorites", "total_specific", "status_counts", "average_rating", "timestamp", "media_id" FROM `user_media_stats_history`;--> statement-breakpoint
DROP TABLE `user_media_stats_history`;--> statement-breakpoint
ALTER TABLE `__new_user_media_stats_history` RENAME TO `user_media_stats_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `ix_user_media_stats_history_user_id` ON `user_media_stats_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_user_media_stats_history_media_type` ON `user_media_stats_history` (`media_type`);--> statement-breakpoint
CREATE INDEX `ix_user_media_stats_history_timestamp` ON `user_media_stats_history` (`timestamp`);