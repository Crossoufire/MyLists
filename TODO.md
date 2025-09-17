# MyLists TODO and FIXES

## KNOWN BUGS:

- KNOWN_BUG: When using react compiler selected rows and pages does not work (tanstack-table)

## Fixes

- FIX: Edit media is a fucking mess, lots of weird stuff
- FIX: changing name when using oAuth ONLY does not change directly, need to logout and login again

## TODO

- TODO: Tests when db empty
- TODO: Tests everything and all CLI tasks :(
- TODO: Improve Typing of provider.service (using generics, passing rawDetails and transformedDetails etc...)

## TODO AFTER PROD

- TODO: Redo the Follows/Followers page in profile (very ugly in mobile and not great in desktop)
- TODO: Where possible directly use `queryOptions` instead of queryKeys in `useMutation` (better for inference)
- TODO: Need a pass on formatting `langs` and numbers. `toFixed()` everywhere with `--` or `-` for profile stats and advanced stats

## External TODO

- TODO: Create `cron` file for maintenance/scheduled tasks
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
