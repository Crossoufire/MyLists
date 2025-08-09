# MyLists TODO and FIXES

## Fixes

## TODO

- TODO: DRY services
- TODO: Redo `logUpdate` using the `UpdateType` in each `mediaService`'s `calculateStats` method and then pass old and new values
  to `userMediaUpdates` service
- TODO: Change all precomputed stats for user and platform to be done, most of them, in SQL (at least for platform!)
- TODO: Add Dispatcher for Media Edit system (Extract etc...)
- TODO: be more consistent on where I create the transformation (backend or frontend) for the stats ("--" / null etc)
- TODO: Deal with `epsPerSeason` for tv in userMedia etc... It is all over the place!
- TODO: Check on `any`, `@ts-expect-error`, `Record<string, any>`, etc...

## External TODO

- TODO: Add rate limiter in `nginx` for prod (for spam protection)
- TODO: Create `cron` file for maintenance/scheduled tasks
