# MyLists TODO and FIXES

## KNOWN BUGS:

- KNOWN_BUG: When using react compiler selected rows and pages does not work (tanstack-table)

## Fixes

- FIX: Edit media is a fucking mess, lots of weird stuff
- FIX: Style issue in add from other list buttons in dropdown
- FIX: `undefined/0` on `Rated` on Summary in profile (should be "--")
- FIX: `0.00/10` on `Avg. Rating` on Statistics in profile (should be "--/10")
- FIX: Avg. Rating Total: 0 Media Rated 0.00 - should be "-" in advanced user stats
- FIX: changing name when using oAuth ONLY does not change directly, need to logout and login again
- FIX: Plaftforms in list filters linked to both media and medialist platforms (should be only medialist)
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
