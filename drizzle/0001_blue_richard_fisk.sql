CREATE TABLE `job_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` text NOT NULL,
	`user_id` integer,
	`status` text NOT NULL,
	`task_name` text NOT NULL,
	`logs` text,
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
CREATE INDEX `ix_job_history_job_id` ON `job_history` (`job_id`);--> statement-breakpoint
CREATE INDEX `ix_job_history_user_id` ON `job_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_job_history_job_status` ON `job_history` (`status`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_user_media_update` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`media_name` text NOT NULL,
	`media_type` text NOT NULL,
	`update_type` text NOT NULL,
	`payload` text,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
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
CREATE TABLE `__new_series_labels` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_labels`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `series_labels`;--> statement-breakpoint
DROP TABLE `series_labels`;--> statement-breakpoint
ALTER TABLE `__new_series_labels` RENAME TO `series_labels`;--> statement-breakpoint
CREATE TABLE `__new_anime_labels` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_labels`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `anime_labels`;--> statement-breakpoint
DROP TABLE `anime_labels`;--> statement-breakpoint
ALTER TABLE `__new_anime_labels` RENAME TO `anime_labels`;--> statement-breakpoint
CREATE TABLE `__new_movies_labels` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_labels`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `movies_labels`;--> statement-breakpoint
DROP TABLE `movies_labels`;--> statement-breakpoint
ALTER TABLE `__new_movies_labels` RENAME TO `movies_labels`;--> statement-breakpoint
CREATE TABLE `__new_games_labels` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_labels`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `games_labels`;--> statement-breakpoint
DROP TABLE `games_labels`;--> statement-breakpoint
ALTER TABLE `__new_games_labels` RENAME TO `games_labels`;--> statement-breakpoint
CREATE TABLE `__new_books_labels` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_labels`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `books_labels`;--> statement-breakpoint
DROP TABLE `books_labels`;--> statement-breakpoint
ALTER TABLE `__new_books_labels` RENAME TO `books_labels`;--> statement-breakpoint
CREATE TABLE `__new_notifications` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer,
	`media_type` text,
	`media_id` integer,
	`payload` text NOT NULL,
	`notification_type` text,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notifications`("id", "user_id", "media_type", "media_id", "payload", "notification_type", "timestamp") SELECT "id", "user_id", "media_type", "media_id", "payload", "notification_type", "timestamp" FROM `notifications`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
ALTER TABLE `__new_notifications` RENAME TO `notifications`;--> statement-breakpoint
CREATE INDEX `ix_notifications_timestamp` ON `notifications` (`timestamp`);--> statement-breakpoint
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
CREATE TABLE `__new_user_mediadle_progress` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`daily_mediadle_id` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`succeeded` integer DEFAULT false NOT NULL,
	`completion_time` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`daily_mediadle_id`) REFERENCES `daily_mediadle`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_mediadle_progress`("id", "user_id", "daily_mediadle_id", "attempts", "completed", "succeeded", "completion_time") SELECT "id", "user_id", "daily_mediadle_id", "attempts", "completed", "succeeded", "completion_time" FROM `user_mediadle_progress`;--> statement-breakpoint
DROP TABLE `user_mediadle_progress`;--> statement-breakpoint
ALTER TABLE `__new_user_mediadle_progress` RENAME TO `user_mediadle_progress`;--> statement-breakpoint
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
CREATE TABLE `__new_manga_list` (
	`current_chapter` integer NOT NULL,
	`redo` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`comment` text,
	`rating` real,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_updated` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_manga_list`("current_chapter", "redo", "total", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated") SELECT "current_chapter", "redo", "total", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated" FROM `manga_list`;--> statement-breakpoint
DROP TABLE `manga_list`;--> statement-breakpoint
ALTER TABLE `__new_manga_list` RENAME TO `manga_list`;--> statement-breakpoint
CREATE TABLE `__new_manga_labels` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_manga_labels`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `manga_labels`;--> statement-breakpoint
DROP TABLE `manga_labels`;--> statement-breakpoint
ALTER TABLE `__new_manga_labels` RENAME TO `manga_labels`;--> statement-breakpoint
CREATE TABLE `__new_movies_list` (
	`redo` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`comment` text,
	`rating` real,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_updated` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_list`("redo", "total", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated") SELECT "redo", "total", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated" FROM `movies_list`;--> statement-breakpoint
DROP TABLE `movies_list`;--> statement-breakpoint
ALTER TABLE `__new_movies_list` RENAME TO `movies_list`;--> statement-breakpoint
CREATE TABLE `__new_games_list` (
	`playtime` integer DEFAULT 0,
	`platform` text,
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`comment` text,
	`rating` real,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_updated` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_list`("playtime", "platform", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated") SELECT "playtime", "platform", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated" FROM `games_list`;--> statement-breakpoint
DROP TABLE `games_list`;--> statement-breakpoint
ALTER TABLE `__new_games_list` RENAME TO `games_list`;--> statement-breakpoint
CREATE TABLE `__new_books_list` (
	`actual_page` integer,
	`redo` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`comment` text,
	`rating` real,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_updated` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_list`("actual_page", "redo", "total", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated") SELECT "actual_page", "redo", "total", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated" FROM `books_list`;--> statement-breakpoint
DROP TABLE `books_list`;--> statement-breakpoint
ALTER TABLE `__new_books_list` RENAME TO `books_list`;--> statement-breakpoint
CREATE TABLE `__new_user_media_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`time_spent` integer DEFAULT 0 NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
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
CREATE TABLE `__new_anime_list` (
	`current_season` integer NOT NULL,
	`current_episode` integer NOT NULL,
	`redo` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`redo2` text DEFAULT '[]' NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`comment` text,
	`rating` real,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_updated` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_list`("current_season", "current_episode", "redo", "total", "redo2", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated") SELECT "current_season", "current_episode", "redo", "total", "redo2", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated" FROM `anime_list`;--> statement-breakpoint
DROP TABLE `anime_list`;--> statement-breakpoint
ALTER TABLE `__new_anime_list` RENAME TO `anime_list`;--> statement-breakpoint
CREATE TABLE `__new_series_list` (
	`current_season` integer NOT NULL,
	`current_episode` integer NOT NULL,
	`redo` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`redo2` text DEFAULT '[]' NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`status` text NOT NULL,
	`favorite` integer,
	`comment` text,
	`rating` real,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_updated` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_list`("current_season", "current_episode", "redo", "total", "redo2", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated") SELECT "current_season", "current_episode", "redo", "total", "redo2", "id", "user_id", "media_id", "status", "favorite", "comment", "rating", "added_at", "last_updated" FROM `series_list`;--> statement-breakpoint
DROP TABLE `series_list`;--> statement-breakpoint
ALTER TABLE `__new_series_list` RENAME TO `series_list`;--> statement-breakpoint
CREATE TABLE `__new_anime_actors` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_actors`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `anime_actors`;--> statement-breakpoint
DROP TABLE `anime_actors`;--> statement-breakpoint
ALTER TABLE `__new_anime_actors` RENAME TO `anime_actors`;--> statement-breakpoint
CREATE TABLE `__new_anime_episodes_per_season` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`season` integer NOT NULL,
	`episodes` integer NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_episodes_per_season`("id", "media_id", "season", "episodes") SELECT "id", "media_id", "season", "episodes" FROM `anime_episodes_per_season`;--> statement-breakpoint
DROP TABLE `anime_episodes_per_season`;--> statement-breakpoint
ALTER TABLE `__new_anime_episodes_per_season` RENAME TO `anime_episodes_per_season`;--> statement-breakpoint
CREATE TABLE `__new_movies_actors` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_actors`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `movies_actors`;--> statement-breakpoint
DROP TABLE `movies_actors`;--> statement-breakpoint
ALTER TABLE `__new_movies_actors` RENAME TO `movies_actors`;--> statement-breakpoint
CREATE TABLE `__new_series_actors` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_actors`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `series_actors`;--> statement-breakpoint
DROP TABLE `series_actors`;--> statement-breakpoint
ALTER TABLE `__new_series_actors` RENAME TO `series_actors`;--> statement-breakpoint
CREATE TABLE `__new_series_episodes_per_season` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`season` integer NOT NULL,
	`episodes` integer NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_episodes_per_season`("id", "media_id", "season", "episodes") SELECT "id", "media_id", "season", "episodes" FROM `series_episodes_per_season`;--> statement-breakpoint
DROP TABLE `series_episodes_per_season`;--> statement-breakpoint
ALTER TABLE `__new_series_episodes_per_season` RENAME TO `series_episodes_per_season`;--> statement-breakpoint
CREATE TABLE `__new_games_platforms` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_platforms`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `games_platforms`;--> statement-breakpoint
DROP TABLE `games_platforms`;--> statement-breakpoint
ALTER TABLE `__new_games_platforms` RENAME TO `games_platforms`;--> statement-breakpoint
CREATE TABLE `__new_games_companies` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	`publisher` integer,
	`developer` integer,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_companies`("id", "media_id", "name", "publisher", "developer") SELECT "id", "media_id", "name", "publisher", "developer" FROM `games_companies`;--> statement-breakpoint
DROP TABLE `games_companies`;--> statement-breakpoint
ALTER TABLE `__new_games_companies` RENAME TO `games_companies`;--> statement-breakpoint
CREATE TABLE `__new_books_authors` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_authors`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `books_authors`;--> statement-breakpoint
DROP TABLE `books_authors`;--> statement-breakpoint
ALTER TABLE `__new_books_authors` RENAME TO `books_authors`;--> statement-breakpoint
CREATE TABLE `__new_books` (
	`pages` integer NOT NULL,
	`language` text,
	`publishers` text,
	`api_id` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`release_date` text,
	`synopsis` text,
	`image_cover` text NOT NULL,
	`lock_status` integer,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_api_update` text
);
--> statement-breakpoint
INSERT INTO `__new_books`("pages", "language", "publishers", "api_id", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update") SELECT "pages", "language", "publishers", "api_id", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update" FROM `books`;--> statement-breakpoint
DROP TABLE `books`;--> statement-breakpoint
ALTER TABLE `__new_books` RENAME TO `books`;--> statement-breakpoint
CREATE UNIQUE INDEX `books_apiId_unique` ON `books` (`api_id`);--> statement-breakpoint
CREATE TABLE `__new_movies` (
	`original_name` text,
	`homepage` text,
	`duration` integer NOT NULL,
	`original_language` text,
	`vote_average` real,
	`vote_count` real,
	`popularity` real,
	`budget` real,
	`revenue` real,
	`tagline` text,
	`api_id` integer NOT NULL,
	`collection_id` integer,
	`director_name` text,
	`compositor_name` text,
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`release_date` text,
	`synopsis` text,
	`image_cover` text NOT NULL,
	`lock_status` integer,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_api_update` text
);
--> statement-breakpoint
INSERT INTO `__new_movies`("original_name", "homepage", "duration", "original_language", "vote_average", "vote_count", "popularity", "budget", "revenue", "tagline", "api_id", "collection_id", "director_name", "compositor_name", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update") SELECT "original_name", "homepage", "duration", "original_language", "vote_average", "vote_count", "popularity", "budget", "revenue", "tagline", "api_id", "collection_id", "director_name", "compositor_name", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update" FROM `movies`;--> statement-breakpoint
DROP TABLE `movies`;--> statement-breakpoint
ALTER TABLE `__new_movies` RENAME TO `movies`;--> statement-breakpoint
CREATE UNIQUE INDEX `movies_apiId_unique` ON `movies` (`api_id`);--> statement-breakpoint
CREATE TABLE `__new_series_genre` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_genre`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `series_genre`;--> statement-breakpoint
DROP TABLE `series_genre`;--> statement-breakpoint
ALTER TABLE `__new_series_genre` RENAME TO `series_genre`;--> statement-breakpoint
CREATE TABLE `__new_anime_genre` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_genre`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `anime_genre`;--> statement-breakpoint
DROP TABLE `anime_genre`;--> statement-breakpoint
ALTER TABLE `__new_anime_genre` RENAME TO `anime_genre`;--> statement-breakpoint
CREATE TABLE `__new_movies_genre` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_genre`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `movies_genre`;--> statement-breakpoint
DROP TABLE `movies_genre`;--> statement-breakpoint
ALTER TABLE `__new_movies_genre` RENAME TO `movies_genre`;--> statement-breakpoint
CREATE TABLE `__new_games_genre` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_genre`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `games_genre`;--> statement-breakpoint
DROP TABLE `games_genre`;--> statement-breakpoint
ALTER TABLE `__new_games_genre` RENAME TO `games_genre`;--> statement-breakpoint
CREATE TABLE `__new_books_genre` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_genre`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `books_genre`;--> statement-breakpoint
DROP TABLE `books_genre`;--> statement-breakpoint
ALTER TABLE `__new_books_genre` RENAME TO `books_genre`;--> statement-breakpoint
CREATE TABLE `__new_series` (
	`original_name` text,
	`last_air_date` text,
	`homepage` text,
	`created_by` text,
	`duration` integer NOT NULL,
	`total_seasons` integer NOT NULL,
	`total_episodes` integer NOT NULL,
	`origin_country` text,
	`prod_status` text,
	`vote_average` real,
	`vote_count` real,
	`popularity` real,
	`api_id` integer NOT NULL,
	`episode_to_air` integer,
	`season_to_air` integer,
	`next_episode_to_air` text,
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`release_date` text,
	`synopsis` text,
	`image_cover` text NOT NULL,
	`lock_status` integer,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_api_update` text
);
--> statement-breakpoint
INSERT INTO `__new_series`("original_name", "last_air_date", "homepage", "created_by", "duration", "total_seasons", "total_episodes", "origin_country", "prod_status", "vote_average", "vote_count", "popularity", "api_id", "episode_to_air", "season_to_air", "next_episode_to_air", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update") SELECT "original_name", "last_air_date", "homepage", "created_by", "duration", "total_seasons", "total_episodes", "origin_country", "prod_status", "vote_average", "vote_count", "popularity", "api_id", "episode_to_air", "season_to_air", "next_episode_to_air", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update" FROM `series`;--> statement-breakpoint
DROP TABLE `series`;--> statement-breakpoint
ALTER TABLE `__new_series` RENAME TO `series`;--> statement-breakpoint
CREATE UNIQUE INDEX `series_apiId_unique` ON `series` (`api_id`);--> statement-breakpoint
CREATE TABLE `__new_series_network` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_network`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `series_network`;--> statement-breakpoint
DROP TABLE `series_network`;--> statement-breakpoint
ALTER TABLE `__new_series_network` RENAME TO `series_network`;--> statement-breakpoint
CREATE TABLE `__new_anime` (
	`original_name` text,
	`last_air_date` text,
	`homepage` text,
	`created_by` text,
	`duration` integer NOT NULL,
	`total_seasons` integer NOT NULL,
	`total_episodes` integer NOT NULL,
	`origin_country` text,
	`prod_status` text,
	`vote_average` real,
	`vote_count` real,
	`popularity` real,
	`api_id` integer NOT NULL,
	`season_to_air` integer,
	`episode_to_air` integer,
	`next_episode_to_air` text,
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`release_date` text,
	`synopsis` text,
	`image_cover` text NOT NULL,
	`lock_status` integer,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_api_update` text
);
--> statement-breakpoint
INSERT INTO `__new_anime`("original_name", "last_air_date", "homepage", "created_by", "duration", "total_seasons", "total_episodes", "origin_country", "prod_status", "vote_average", "vote_count", "popularity", "api_id", "season_to_air", "episode_to_air", "next_episode_to_air", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update") SELECT "original_name", "last_air_date", "homepage", "created_by", "duration", "total_seasons", "total_episodes", "origin_country", "prod_status", "vote_average", "vote_count", "popularity", "api_id", "season_to_air", "episode_to_air", "next_episode_to_air", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update" FROM `anime`;--> statement-breakpoint
DROP TABLE `anime`;--> statement-breakpoint
ALTER TABLE `__new_anime` RENAME TO `anime`;--> statement-breakpoint
CREATE UNIQUE INDEX `anime_apiId_unique` ON `anime` (`api_id`);--> statement-breakpoint
CREATE TABLE `__new_anime_network` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_network`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `anime_network`;--> statement-breakpoint
DROP TABLE `anime_network`;--> statement-breakpoint
ALTER TABLE `__new_anime_network` RENAME TO `anime_network`;--> statement-breakpoint
CREATE TABLE `__new_games` (
	`game_engine` text,
	`game_modes` text,
	`player_perspective` text,
	`vote_average` real,
	`vote_count` real,
	`igdb_url` text,
	`hltb_main_time` real,
	`hltb_main_and_extra_time` real,
	`hltb_total_complete_time` real,
	`api_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`release_date` text,
	`synopsis` text,
	`image_cover` text NOT NULL,
	`lock_status` integer,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_api_update` text
);
--> statement-breakpoint
INSERT INTO `__new_games`("game_engine", "game_modes", "player_perspective", "vote_average", "vote_count", "igdb_url", "hltb_main_time", "hltb_main_and_extra_time", "hltb_total_complete_time", "api_id", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update") SELECT "game_engine", "game_modes", "player_perspective", "vote_average", "vote_count", "igdb_url", "hltb_main_time", "hltb_main_and_extra_time", "hltb_total_complete_time", "api_id", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;--> statement-breakpoint
CREATE UNIQUE INDEX `games_apiId_unique` ON `games` (`api_id`);--> statement-breakpoint
CREATE TABLE `__new_achievement` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code_name` text NOT NULL,
	`description` text NOT NULL,
	`media_type` text NOT NULL,
	`value` text
);
--> statement-breakpoint
INSERT INTO `__new_achievement`("id", "name", "code_name", "description", "media_type", "value") SELECT "id", "name", "code_name", "description", "media_type", "value" FROM `achievement`;--> statement-breakpoint
DROP TABLE `achievement`;--> statement-breakpoint
ALTER TABLE `__new_achievement` RENAME TO `achievement`;--> statement-breakpoint
CREATE TABLE `__new_daily_mediadle` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_type` text NOT NULL,
	`media_id` integer NOT NULL,
	`date` text NOT NULL,
	`pixelation_levels` integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_daily_mediadle`("id", "media_type", "media_id", "date", "pixelation_levels") SELECT "id", "media_type", "media_id", "date", "pixelation_levels" FROM `daily_mediadle`;--> statement-breakpoint
DROP TABLE `daily_mediadle`;--> statement-breakpoint
ALTER TABLE `__new_daily_mediadle` RENAME TO `daily_mediadle`;--> statement-breakpoint
CREATE TABLE `__new_achievement_tier` (
	`id` integer PRIMARY KEY NOT NULL,
	`achievement_id` integer NOT NULL,
	`difficulty` text NOT NULL,
	`criteria` text NOT NULL,
	`rarity` real,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_achievement_tier`("id", "achievement_id", "difficulty", "criteria", "rarity") SELECT "id", "achievement_id", "difficulty", "criteria", "rarity" FROM `achievement_tier`;--> statement-breakpoint
DROP TABLE `achievement_tier`;--> statement-breakpoint
ALTER TABLE `__new_achievement_tier` RENAME TO `achievement_tier`;--> statement-breakpoint
CREATE TABLE `__new_manga` (
	`original_name` text,
	`chapters` integer,
	`prod_status` text,
	`site_url` text,
	`end_date` text,
	`volumes` integer,
	`vote_average` real,
	`vote_count` real,
	`popularity` real,
	`publishers` text,
	`api_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`release_date` text,
	`synopsis` text,
	`image_cover` text NOT NULL,
	`lock_status` integer,
	`added_at` text DEFAULT (CURRENT_TIMESTAMP),
	`last_api_update` text
);
--> statement-breakpoint
INSERT INTO `__new_manga`("original_name", "chapters", "prod_status", "site_url", "end_date", "volumes", "vote_average", "vote_count", "popularity", "publishers", "api_id", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update") SELECT "original_name", "chapters", "prod_status", "site_url", "end_date", "volumes", "vote_average", "vote_count", "popularity", "publishers", "api_id", "id", "name", "release_date", "synopsis", "image_cover", "lock_status", "added_at", "last_api_update" FROM `manga`;--> statement-breakpoint
DROP TABLE `manga`;--> statement-breakpoint
ALTER TABLE `__new_manga` RENAME TO `manga`;--> statement-breakpoint
CREATE UNIQUE INDEX `manga_apiId_unique` ON `manga` (`api_id`);--> statement-breakpoint
CREATE TABLE `__new_manga_authors` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_manga_authors`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `manga_authors`;--> statement-breakpoint
DROP TABLE `manga_authors`;--> statement-breakpoint
ALTER TABLE `__new_manga_authors` RENAME TO `manga_authors`;--> statement-breakpoint
CREATE TABLE `__new_manga_genre` (
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_manga_genre`("id", "media_id", "name") SELECT "id", "media_id", "name" FROM `manga_genre`;--> statement-breakpoint
DROP TABLE `manga_genre`;--> statement-breakpoint
ALTER TABLE `__new_manga_genre` RENAME TO `manga_genre`;--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` integer PRIMARY KEY NOT NULL,
	`account_id` integer,
	`provider_id` text,
	`user_id` integer NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_account`("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") SELECT "id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at" FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` integer PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id") SELECT "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_notif_read_time` text,
	`profile_views` integer DEFAULT 0 NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`email_verified` integer NOT NULL,
	`privacy` text DEFAULT 'restricted' NOT NULL,
	`grid_list_view` integer DEFAULT true NOT NULL,
	`image` text DEFAULT 'default.jpg' NOT NULL,
	`show_update_modal` integer DEFAULT true NOT NULL,
	`rating_system` text DEFAULT 'score' NOT NULL,
	`search_selector` text DEFAULT 'tmdb' NOT NULL,
	`background_image` text DEFAULT 'default.jpg' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "created_at", "updated_at", "last_notif_read_time", "profile_views", "role", "email_verified", "privacy", "grid_list_view", "image", "show_update_modal", "rating_system", "search_selector", "background_image") SELECT "id", "name", "email", "created_at", "updated_at", "last_notif_read_time", "profile_views", "role", "email_verified", "privacy", "grid_list_view", "image", "show_update_modal", "rating_system", "search_selector", "background_image" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `__new_verification` (
	`id` integer PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_verification`("id", "identifier", "value", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "value", "expires_at", "created_at", "updated_at" FROM `verification`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
ALTER TABLE `__new_verification` RENAME TO `verification`;