CREATE TABLE `user_media_activity` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`specific_gained` real NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`is_redo` integer DEFAULT false NOT NULL,
	`month_bucket` text NOT NULL,
	`last_update` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_user_media_activity_user_id` ON `user_media_activity` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_user_media_activity_media_id` ON `user_media_activity` (`media_id`);--> statement-breakpoint
CREATE INDEX `ix_user_media_activity_media_type` ON `user_media_activity` (`media_type`);--> statement-breakpoint
CREATE INDEX `ix_user_media_activity_month_bucket` ON `user_media_activity` (`month_bucket`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_media_month_idx` ON `user_media_activity` (`user_id`,`media_id`,`media_type`,`month_bucket`);