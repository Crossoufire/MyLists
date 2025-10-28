CREATE TABLE `job_history` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer,
	`job_id` text NOT NULL,
	`finished_on` text,
	`processed_on` text,
	`failed_reason` text,
	`task_name` text NOT NULL,
	`data` text,
	`job_status` text NOT NULL,
	`triggered_by` text NOT NULL,
	`return_value` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_job_history_job_id` ON `job_history` (`job_id`);--> statement-breakpoint
CREATE INDEX `ix_job_history_user_id` ON `job_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_job_history_job_status` ON `job_history` (`job_status`);