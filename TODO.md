# MyLists TODO and FIXES

## KNOWN BUGS:

- KNOWN_BUG: When using react compiler selected rows does not work (same for pages)

## Fixes

- FIX: changing name when using oAuth ONLY does not change directly, need to logout and login again
- FIX: problem with "default.jpg" should be an url not just a string to work properly

## TODO

- TODO: Implement forgot password
- TODO: Finish UI apparance for media details
- TODO: Where possible directly use `queryOptions` instead of queryKeys in `useMutation` (better for inference)

## External TODO

- TODO: Create `cron` file for maintenance/scheduled tasks
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
