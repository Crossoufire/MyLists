CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`privacy` text DEFAULT 'private' NOT NULL,
	`ordered` integer DEFAULT false NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`copied_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_collections_owner_id` ON `collections` (`owner_id`);
--> statement-breakpoint
CREATE INDEX `ix_collections_media_type` ON `collections` (`media_type`);
--> statement-breakpoint
CREATE INDEX `ix_collections_privacy` ON `collections` (`privacy`);
--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`media_type` text NOT NULL,
	`order_index` integer NOT NULL,
	`annotation` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_collection_items_collection_id` ON `collection_items` (`collection_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_collection_items_collection_media` ON `collection_items` (`collection_id`,`media_id`);
--> statement-breakpoint
CREATE TABLE `collection_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_collection_likes_collection_id` ON `collection_likes` (`collection_id`);
--> statement-breakpoint
CREATE INDEX `ix_collection_likes_user_id` ON `collection_likes` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_collection_likes_collection_user` ON `collection_likes` (`collection_id`,`user_id`);
