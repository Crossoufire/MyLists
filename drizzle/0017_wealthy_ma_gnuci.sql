ALTER TABLE `anime_collections` RENAME TO `anime_tags`;--> statement-breakpoint
ALTER TABLE `books_collections` RENAME TO `books_tags`;--> statement-breakpoint
ALTER TABLE `games_collections` RENAME TO `games_tags`;--> statement-breakpoint
ALTER TABLE `manga_collections` RENAME TO `manga_tags`;--> statement-breakpoint
ALTER TABLE `movies_collections` RENAME TO `movies_tags`;--> statement-breakpoint
ALTER TABLE `series_collections` RENAME TO `series_tags`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_anime_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_tags`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `anime_tags`;--> statement-breakpoint
DROP TABLE `anime_tags`;--> statement-breakpoint
ALTER TABLE `__new_anime_tags` RENAME TO `anime_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_books_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_tags`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `books_tags`;--> statement-breakpoint
DROP TABLE `books_tags`;--> statement-breakpoint
ALTER TABLE `__new_books_tags` RENAME TO `books_tags`;--> statement-breakpoint
CREATE TABLE `__new_games_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_tags`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `games_tags`;--> statement-breakpoint
DROP TABLE `games_tags`;--> statement-breakpoint
ALTER TABLE `__new_games_tags` RENAME TO `games_tags`;--> statement-breakpoint
CREATE TABLE `__new_manga_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_manga_tags`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `manga_tags`;--> statement-breakpoint
DROP TABLE `manga_tags`;--> statement-breakpoint
ALTER TABLE `__new_manga_tags` RENAME TO `manga_tags`;--> statement-breakpoint
CREATE TABLE `__new_movies_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_tags`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `movies_tags`;--> statement-breakpoint
DROP TABLE `movies_tags`;--> statement-breakpoint
ALTER TABLE `__new_movies_tags` RENAME TO `movies_tags`;--> statement-breakpoint
CREATE TABLE `__new_series_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`media_id` integer,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_tags`("id", "user_id", "media_id", "name") SELECT "id", "user_id", "media_id", "name" FROM `series_tags`;--> statement-breakpoint
DROP TABLE `series_tags`;--> statement-breakpoint
ALTER TABLE `__new_series_tags` RENAME TO `series_tags`;