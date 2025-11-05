PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_achievement_tier` (
	`id` integer PRIMARY KEY NOT NULL,
	`achievement_id` integer NOT NULL,
	`difficulty` text NOT NULL,
	`criteria` text NOT NULL,
	`rarity` real,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_achievement_tier`("id", "achievement_id", "difficulty", "criteria", "rarity") SELECT "id", "achievement_id", "difficulty", "criteria", "rarity" FROM `achievement_tier`;--> statement-breakpoint
DROP TABLE `achievement_tier`;--> statement-breakpoint
ALTER TABLE `__new_achievement_tier` RENAME TO `achievement_tier`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `achievement_difficulty_unique_idx` ON `achievement_tier` (`achievement_id`,`difficulty`);--> statement-breakpoint
CREATE TABLE `__new_user_achievement` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer,
	`achievement_id` integer,
	`tier_id` integer,
	`progress` real,
	`count` real,
	`completed` integer,
	`completed_at` text,
	`last_calculated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tier_id`) REFERENCES `achievement_tier`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_achievement`("id", "user_id", "achievement_id", "tier_id", "progress", "count", "completed", "completed_at", "last_calculated_at") SELECT "id", "user_id", "achievement_id", "tier_id", "progress", "count", "completed", "completed_at", "last_calculated_at" FROM `user_achievement`;--> statement-breakpoint
DROP TABLE `user_achievement`;--> statement-breakpoint
ALTER TABLE `__new_user_achievement` RENAME TO `user_achievement`;