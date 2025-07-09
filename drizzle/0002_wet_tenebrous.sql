PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer,
	`media_type` text,
	`media_id` integer,
	`payload` text NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`notification_type` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "user_id", "media_type", "media_id", "payload", "timestamp", "notification_type") SELECT "id", "user_id", "media_type", "media_id", "payload", "timestamp", "notification_type" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `ix_notifications_timestamp` ON `notifications` (`timestamp`);