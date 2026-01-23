CREATE TABLE `media_notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`media_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`season` integer,
	`episode` integer,
	`is_season_finale` integer,
	`release_date` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `social_notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`actor_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_notif_unique` ON `social_notifications` (`user_id`,`actor_id`,`type`);--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `last_notif_read_time`;