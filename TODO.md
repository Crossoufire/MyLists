# MyLists TODO and FIXES

## KNOWN BUGS:

- KNOWN_BUG: When using react compiler selected rows does not work (same for pages, tanstack-table)

## Fixes

- FIX: Error updating redo tv
- FIX: Admin Mediadle, seach does not work
- FIX: sidebar not working/showing on mobile
- FIX: Error updating platform in games details
- FIX: Edit media is a fucking mess, lots of weird stuff
- FIX: Style issue in add from other list buttons in dropdown
- FIX: Admin Users and Mediadle table not responsive in mobile
- FIX: `undefined/0` on `Rated` on Summary in profile (should be "--")
- FIX: `0.00/10` on `Avg. Rating` on Statistics in profile (should be "--/10")
- FIX: Notification text is `currentUser is following you`, should be the opposite
- FIX: Avg. Rating Total: 0 Media Rated 0.00 - should be "-" in advanced user stats
- FIX: Admin dashboard Make title of running tasks better (add space and maj for title)
- FIX: changing name when using oAuth ONLY does not change directly, need to logout and login again
- FIX: when adding book to list rating is feeling, on reload becomes score (should be always score for my account)

## TODO

- TODO: Tests when db empty
- TODO: Tests everything and all CLI tasks :(

## TODO AFTER PROD

- TODO: Redo the Follows/Followers page in profile (very ugly in mobile and not great in desktop)
- TODO: Where possible directly use `queryOptions` instead of queryKeys in `useMutation` (better for inference)

## External TODO

- TODO: Create `cron` file for maintenance/scheduled tasks
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
