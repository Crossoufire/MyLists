ALTER TABLE `anime_list` RENAME COLUMN "last_episode_watched" TO "current_episode";--> statement-breakpoint
ALTER TABLE `series_list` RENAME COLUMN "last_episode_watched" TO "current_episode";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_media_update` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`media_name` text NOT NULL,
	`media_type` text NOT NULL,
	`update_type` text NOT NULL,
	`payload` text,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_media_update`("id", "user_id", "media_id", "media_name", "media_type", "update_type", "payload", "timestamp") SELECT "id", "user_id", "media_id", "media_name", "media_type", "update_type", "payload", "timestamp" FROM `user_media_update`;--> statement-breakpoint
DROP TABLE `user_media_update`;--> statement-breakpoint
ALTER TABLE `__new_user_media_update` RENAME TO `user_media_update`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `ix_user_media_update_media_id` ON `user_media_update` (`media_id`);--> statement-breakpoint
CREATE INDEX `ix_user_media_update_timestamp` ON `user_media_update` (`timestamp`);--> statement-breakpoint
CREATE INDEX `ix_user_media_update_media_type` ON `user_media_update` (`media_type`);--> statement-breakpoint
CREATE INDEX `ix_user_media_update_user_id` ON `user_media_update` (`user_id`);