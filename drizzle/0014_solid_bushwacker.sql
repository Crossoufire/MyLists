CREATE TABLE `media_refresh_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`api_id` text NOT NULL,
	`refreshed_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_media_refresh_log_user_id` ON `media_refresh_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_media_refresh_log_refreshed_at` ON `media_refresh_log` (`refreshed_at`);--> statement-breakpoint
CREATE INDEX `ix_media_refresh_log_media_type` ON `media_refresh_log` (`media_type`);