# MyLists TODO and FIXES

## KNOWN BUGS:

- KNOWN_BUG: When using react compiler selected rows and pages does not work (tanstack-table)

## Fixes

- FIX: changing name when using oAuth ONLY does not change directly, need to logout and login again

## TODO

- TODO: check tanstarter for Start RC update :)
- TODO: better files managements, clear separation between client and server
- TODO: redistribute the utils between client-utils and server-utils (server-utils only for server-side and client-utils for both,
  meaning if a function is agnostic to the client or server, it should be in client-utils, or may be not... need to think about it)
- TODO: Tests when db empty
- TODO: Tests everything and all CLI tasks :(

## TODO AFTER PROD

- TODO: Redo the Follows/Followers page in profile (very ugly in mobile and not great in desktop)
- TODO: Where possible directly use `queryOptions` instead of `queryKeys` in `useMutation` (better for inference)

## External TODO

- TODO: create an `ecosystem.config.mjs` file for `pm2`
- TODO: Create `cron.sh` file for maintenance/scheduled tasks
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
