PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_job_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer,
	`status` text NOT NULL,
	`task_name` text NOT NULL,
	`finished_on` integer,
	`failed_reason` text,
	`processed_on` integer,
	`data` text,
	`timestamp` integer NOT NULL,
	`triggered_by` text NOT NULL,
	`return_value` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `job_history`;--> statement-breakpoint
ALTER TABLE `__new_job_history` RENAME TO `job_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `ix_job_history_job_id` ON `job_history` (`id`);--> statement-breakpoint
CREATE INDEX `ix_job_history_user_id` ON `job_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_job_history_job_status` ON `job_history` (`status`);