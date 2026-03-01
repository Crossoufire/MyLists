DROP INDEX `ix_user_media_settings_user_id`;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_id_media_type` ON `user_media_settings` (`user_id`,`media_type`);