CREATE TABLE `profile_custom` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_profile_custom_user_id` ON `profile_custom` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_profile_custom_user_id_key` ON `profile_custom` (`user_id`,`key`);
