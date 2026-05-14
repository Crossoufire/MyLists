DROP INDEX `ix_feature_votes_vote_type`;
--> statement-breakpoint
ALTER TABLE `feature_votes` DROP COLUMN `vote_type`;
