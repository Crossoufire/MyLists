DROP INDEX `ix_manga_labels_user_id`;--> statement-breakpoint
DROP INDEX `ix_manga_list_id`;--> statement-breakpoint
DROP INDEX `ix_manga_list_user_id`;--> statement-breakpoint
ALTER TABLE `manga_list` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `manga_list` ADD `last_updated` text;--> statement-breakpoint
ALTER TABLE `anime` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `anime_list` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `anime_list` ADD `last_updated` text;--> statement-breakpoint
ALTER TABLE `books` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `books_list` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `books_list` ADD `last_updated` text;--> statement-breakpoint
ALTER TABLE `games` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `games_list` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `games_list` ADD `last_updated` text;--> statement-breakpoint
ALTER TABLE `manga` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `movies` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `movies_list` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `movies_list` ADD `last_updated` text;--> statement-breakpoint
ALTER TABLE `series` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `series_list` ADD `added_at` text;--> statement-breakpoint
ALTER TABLE `series_list` ADD `last_updated` text;