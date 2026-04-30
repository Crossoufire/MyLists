ALTER TABLE `books_list` ADD `page_count` integer;--> statement-breakpoint
ALTER TABLE `books_list` ADD `language` text;--> statement-breakpoint
ALTER TABLE `books_list` ADD `publisher` text;--> statement-breakpoint
UPDATE `books_list`
SET
    `page_count` = (
        SELECT `books`.`pages`
        FROM `books`
        WHERE `books`.`id` = `books_list`.`media_id`
    ),
    `language` = (
        SELECT `books`.`language`
        FROM `books`
        WHERE `books`.`id` = `books_list`.`media_id`
    ),
    `publisher` = (
        SELECT `books`.`publishers`
        FROM `books`
        WHERE `books`.`id` = `books_list`.`media_id`
    )
WHERE EXISTS (
    SELECT 1
    FROM `books`
    WHERE `books`.`id` = `books_list`.`media_id`
);
