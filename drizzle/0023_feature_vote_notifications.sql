ALTER TABLE `social_notifications` ADD `feature_request_id` integer REFERENCES `feature_requests`(`id`) ON UPDATE no action ON DELETE cascade;
--> statement-breakpoint
DROP INDEX `social_notif_unique`;
--> statement-breakpoint
CREATE UNIQUE INDEX `social_notif_unique` ON `social_notifications` (`user_id`,`actor_id`,`type`) WHERE `feature_request_id` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `social_feature_notif_unique` ON `social_notifications` (`user_id`,`actor_id`,`type`,`feature_request_id`) WHERE `feature_request_id` IS NOT NULL;
