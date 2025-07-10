PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_anime_labels` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_labels`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `anime_labels`;--> statement-breakpoint
DROP TABLE `anime_labels`;--> statement-breakpoint
ALTER TABLE `__new_anime_labels` RENAME TO `anime_labels`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_anime_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`current_season` integer NOT NULL,
	`last_episode_watched` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`redo` integer DEFAULT 0,
	`comment` text,
	`total` integer DEFAULT 0,
	`rating` real,
	`redo2` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_list`("id", "user_id", "media_id", "current_season", "last_episode_watched", "status", "favorite", "redo", "comment", "total", "rating", "redo2") SELECT "id", "user_id", "media_id", "current_season", "last_episode_watched", "status", "favorite", "redo", "comment", "total", "rating", "redo2" FROM `anime_list`;--> statement-breakpoint
DROP TABLE `anime_list`;--> statement-breakpoint
ALTER TABLE `__new_anime_list` RENAME TO `anime_list`;--> statement-breakpoint
CREATE TABLE `__new_books_labels` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_labels`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `books_labels`;--> statement-breakpoint
DROP TABLE `books_labels`;--> statement-breakpoint
ALTER TABLE `__new_books_labels` RENAME TO `books_labels`;--> statement-breakpoint
CREATE TABLE `__new_books_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`redo` integer DEFAULT 0,
	`actual_page` integer,
	`total` integer DEFAULT 0,
	`comment` text,
	`rating` real,
	`favorite` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_list`("id", "user_id", "media_id", "status", "redo", "actual_page", "total", "comment", "rating", "favorite") SELECT "id", "user_id", "media_id", "status", "redo", "actual_page", "total", "comment", "rating", "favorite" FROM `books_list`;--> statement-breakpoint
DROP TABLE `books_list`;--> statement-breakpoint
ALTER TABLE `__new_books_list` RENAME TO `books_list`;--> statement-breakpoint
CREATE TABLE `__new_followers` (
	`follower_id` integer,
	`followed_id` integer,
	FOREIGN KEY (`follower_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`followed_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_followers`("follower_id", "followed_id") SELECT "follower_id", "followed_id" FROM `followers`;--> statement-breakpoint
DROP TABLE `followers`;--> statement-breakpoint
ALTER TABLE `__new_followers` RENAME TO `followers`;--> statement-breakpoint
CREATE TABLE `__new_games_labels` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_labels`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `games_labels`;--> statement-breakpoint
DROP TABLE `games_labels`;--> statement-breakpoint
ALTER TABLE `__new_games_labels` RENAME TO `games_labels`;--> statement-breakpoint
CREATE TABLE `__new_games_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`playtime` integer DEFAULT 0,
	`favorite` integer,
	`comment` text,
	`platform` text,
	`rating` real,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_list`("id", "user_id", "media_id", "status", "playtime", "favorite", "comment", "platform", "rating") SELECT "id", "user_id", "media_id", "status", "playtime", "favorite", "comment", "platform", "rating" FROM `games_list`;--> statement-breakpoint
DROP TABLE `games_list`;--> statement-breakpoint
ALTER TABLE `__new_games_list` RENAME TO `games_list`;--> statement-breakpoint
CREATE TABLE `__new_manga_labels` (
	`media_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_manga_labels`("media_id", "id", "user_id", "name") SELECT "media_id", "id", "user_id", "name" FROM `manga_labels`;--> statement-breakpoint
DROP TABLE `manga_labels`;--> statement-breakpoint
ALTER TABLE `__new_manga_labels` RENAME TO `manga_labels`;--> statement-breakpoint
CREATE INDEX `ix_manga_labels_user_id` ON `manga_labels` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_manga_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`current_chapter` integer NOT NULL,
	`total` integer,
	`redo` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`rating` real,
	`favorite` integer,
	`comment` text,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_manga_list`("id", "media_id", "user_id", "current_chapter", "total", "redo", "status", "rating", "favorite", "comment") SELECT "id", "media_id", "user_id", "current_chapter", "total", "redo", "status", "rating", "favorite", "comment" FROM `manga_list`;--> statement-breakpoint
DROP TABLE `manga_list`;--> statement-breakpoint
ALTER TABLE `__new_manga_list` RENAME TO `manga_list`;--> statement-breakpoint
CREATE INDEX `ix_manga_list_user_id` ON `manga_list` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_manga_list_id` ON `manga_list` (`id`);--> statement-breakpoint
CREATE TABLE `__new_mediadle_stats` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`total_played` integer,
	`total_won` integer,
	`average_attempts` real,
	`streak` integer,
	`best_streak` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_mediadle_stats`("id", "user_id", "media_type", "total_played", "total_won", "average_attempts", "streak", "best_streak") SELECT "id", "user_id", "media_type", "total_played", "total_won", "average_attempts", "streak", "best_streak" FROM `mediadle_stats`;--> statement-breakpoint
DROP TABLE `mediadle_stats`;--> statement-breakpoint
ALTER TABLE `__new_mediadle_stats` RENAME TO `mediadle_stats`;--> statement-breakpoint
CREATE TABLE `__new_movies_labels` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_labels`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `movies_labels`;--> statement-breakpoint
DROP TABLE `movies_labels`;--> statement-breakpoint
ALTER TABLE `__new_movies_labels` RENAME TO `movies_labels`;--> statement-breakpoint
CREATE TABLE `__new_movies_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`redo` integer DEFAULT 0,
	`comment` text,
	`total` integer DEFAULT 0,
	`rating` real,
	`favorite` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_list`("id", "user_id", "media_id", "status", "redo", "comment", "total", "rating", "favorite") SELECT "id", "user_id", "media_id", "status", "redo", "comment", "total", "rating", "favorite" FROM `movies_list`;--> statement-breakpoint
DROP TABLE `movies_list`;--> statement-breakpoint
ALTER TABLE `__new_movies_list` RENAME TO `movies_list`;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer,
	`media_type` text,
	`media_id` integer,
	`payload` text NOT NULL,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`notification_type` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "user_id", "media_type", "media_id", "payload", "timestamp", "notification_type") SELECT "id", "user_id", "media_type", "media_id", "payload", "timestamp", "notification_type" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
CREATE INDEX `ix_notifications_timestamp` ON `notifications` (`timestamp`);--> statement-breakpoint
CREATE TABLE `__new_series_labels` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_labels`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `series_labels`;--> statement-breakpoint
DROP TABLE `series_labels`;--> statement-breakpoint
ALTER TABLE `__new_series_labels` RENAME TO `series_labels`;--> statement-breakpoint
CREATE TABLE `__new_series_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`current_season` integer NOT NULL,
	`last_episode_watched` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`redo` integer DEFAULT 0,
	`comment` text,
	`total` integer DEFAULT 0,
	`rating` real,
	`redo2` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_list`("id", "user_id", "media_id", "current_season", "last_episode_watched", "status", "favorite", "redo", "comment", "total", "rating", "redo2") SELECT "id", "user_id", "media_id", "current_season", "last_episode_watched", "status", "favorite", "redo", "comment", "total", "rating", "redo2" FROM `series_list`;--> statement-breakpoint
DROP TABLE `series_list`;--> statement-breakpoint
ALTER TABLE `__new_series_list` RENAME TO `series_list`;--> statement-breakpoint
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
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tier_id`) REFERENCES `achievement_tier`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_achievement`("id", "user_id", "achievement_id", "tier_id", "progress", "count", "completed", "completed_at", "last_calculated_at") SELECT "id", "user_id", "achievement_id", "tier_id", "progress", "count", "completed", "completed_at", "last_calculated_at" FROM `user_achievement`;--> statement-breakpoint
DROP TABLE `user_achievement`;--> statement-breakpoint
ALTER TABLE `__new_user_achievement` RENAME TO `user_achievement`;--> statement-breakpoint
CREATE TABLE `__new_user_media_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`time_spent` integer NOT NULL,
	`views` integer NOT NULL,
	`active` integer NOT NULL,
	`total_entries` integer DEFAULT 0 NOT NULL,
	`total_redo` integer DEFAULT 0 NOT NULL,
	`entries_rated` integer DEFAULT 0 NOT NULL,
	`sum_entries_rated` integer DEFAULT 0 NOT NULL,
	`entries_commented` integer DEFAULT 0 NOT NULL,
	`entries_favorites` integer DEFAULT 0 NOT NULL,
	`total_specific` integer DEFAULT 0 NOT NULL,
	`status_counts` text DEFAULT '{}' NOT NULL,
	`average_rating` real,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_media_settings`("id", "user_id", "media_type", "time_spent", "views", "active", "total_entries", "total_redo", "entries_rated", "sum_entries_rated", "entries_commented", "entries_favorites", "total_specific", "status_counts", "average_rating") SELECT "id", "user_id", "media_type", "time_spent", "views", "active", "total_entries", "total_redo", "entries_rated", "sum_entries_rated", "entries_commented", "entries_favorites", "total_specific", "status_counts", "average_rating" FROM `user_media_settings`;--> statement-breakpoint
DROP TABLE `user_media_settings`;--> statement-breakpoint
ALTER TABLE `__new_user_media_settings` RENAME TO `user_media_settings`;--> statement-breakpoint
CREATE INDEX `ix_user_media_settings_user_id` ON `user_media_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_user_media_settings_media_type` ON `user_media_settings` (`media_type`);--> statement-breakpoint
CREATE TABLE `__new_user_media_update` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`media_name` text NOT NULL,
	`media_type` text NOT NULL,
	`update_type` text NOT NULL,
	`payload` text,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_media_update`("id", "user_id", "media_id", "media_name", "media_type", "update_type", "payload", "timestamp") SELECT "id", "user_id", "media_id", "media_name", "media_type", "update_type", "payload", "timestamp" FROM `user_media_update`;--> statement-breakpoint
DROP TABLE `user_media_update`;--> statement-breakpoint
ALTER TABLE `__new_user_media_update` RENAME TO `user_media_update`;--> statement-breakpoint
CREATE INDEX `ix_user_media_update_media_id` ON `user_media_update` (`media_id`);--> statement-breakpoint
CREATE INDEX `ix_user_media_update_timestamp` ON `user_media_update` (`timestamp`);--> statement-breakpoint
CREATE INDEX `ix_user_media_update_media_type` ON `user_media_update` (`media_type`);--> statement-breakpoint
CREATE INDEX `ix_user_media_update_user_id` ON `user_media_update` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_user_mediadle_progress` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`daily_mediadle_id` integer NOT NULL,
	`attempts` integer DEFAULT 0,
	`completed` integer DEFAULT false,
	`succeeded` integer DEFAULT false,
	`completion_time` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`daily_mediadle_id`) REFERENCES `daily_mediadle`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_mediadle_progress`("id", "user_id", "daily_mediadle_id", "attempts", "completed", "succeeded", "completion_time") SELECT "id", "user_id", "daily_mediadle_id", "attempts", "completed", "succeeded", "completion_time" FROM `user_mediadle_progress`;--> statement-breakpoint
DROP TABLE `user_mediadle_progress`;--> statement-breakpoint
ALTER TABLE `__new_user_mediadle_progress` RENAME TO `user_mediadle_progress`;