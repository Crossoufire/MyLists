CREATE TABLE `feature_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'Under Consideration' NOT NULL,
	`admin_comment` text,
	`created_by` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ix_feature_requests_status` ON `feature_requests` (`status`);--> statement-breakpoint
CREATE INDEX `ix_feature_requests_created_at` ON `feature_requests` (`created_at`);--> statement-breakpoint
CREATE TABLE `feature_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feature_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`vote_type` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`feature_id`) REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_feature_votes_feature_user` ON `feature_votes` (`feature_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `ix_feature_votes_user_id` ON `feature_votes` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_feature_votes_feature_id` ON `feature_votes` (`feature_id`);--> statement-breakpoint
CREATE INDEX `ix_feature_votes_vote_type` ON `feature_votes` (`vote_type`);