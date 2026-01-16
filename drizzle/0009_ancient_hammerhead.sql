ALTER TABLE `anime_labels` RENAME TO `anime_collections`;--> statement-breakpoint
ALTER TABLE `books_labels` RENAME TO `books_collections`;--> statement-breakpoint
ALTER TABLE `games_labels` RENAME TO `games_collections`;--> statement-breakpoint
ALTER TABLE `manga_labels` RENAME TO `manga_collections`;--> statement-breakpoint
ALTER TABLE `movies_labels` RENAME TO `movies_collections`;--> statement-breakpoint
ALTER TABLE `series_labels` RENAME TO `series_collections`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_anime_collections` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_anime_collections`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `anime_collections`;--> statement-breakpoint
DROP TABLE `anime_collections`;--> statement-breakpoint
ALTER TABLE `__new_anime_collections` RENAME TO `anime_collections`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_books_collections` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_books_collections`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `books_collections`;--> statement-breakpoint
DROP TABLE `books_collections`;--> statement-breakpoint
ALTER TABLE `__new_books_collections` RENAME TO `books_collections`;--> statement-breakpoint
CREATE TABLE `__new_games_collections` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_games_collections`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `games_collections`;--> statement-breakpoint
DROP TABLE `games_collections`;--> statement-breakpoint
ALTER TABLE `__new_games_collections` RENAME TO `games_collections`;--> statement-breakpoint
CREATE TABLE `__new_manga_collections` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `manga`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_manga_collections`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `manga_collections`;--> statement-breakpoint
DROP TABLE `manga_collections`;--> statement-breakpoint
ALTER TABLE `__new_manga_collections` RENAME TO `manga_collections`;--> statement-breakpoint
CREATE TABLE `__new_movies_collections` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_movies_collections`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `movies_collections`;--> statement-breakpoint
DROP TABLE `movies_collections`;--> statement-breakpoint
ALTER TABLE `__new_movies_collections` RENAME TO `movies_collections`;--> statement-breakpoint
CREATE TABLE `__new_series_collections` (
	`user_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_series_collections`("user_id", "id", "media_id", "name") SELECT "user_id", "id", "media_id", "name" FROM `series_collections`;--> statement-breakpoint
DROP TABLE `series_collections`;--> statement-breakpoint
ALTER TABLE `__new_series_collections` RENAME TO `series_collections`;