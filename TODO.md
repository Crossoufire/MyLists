# MyLists TODO and FIXES

## Fixes

- FIX: Trying to add series to list: Error linked to:
- `'update "user_media_settings", COALESCE("user_media_settings"."status_counts", params: [ NaN, 1, NaN, 1, 0, 0, 0, 3, 'series' ]`
- FIX: Fucking external vs internal id for media details is SHIT. Can't never know if mediaId is internal or not, this is bad!

## TODO

- TODO: Change all precomputed stats for user and platform to be done, most of them, in sql (at least for platform!)
- TODO: Add cache system in `PlatformStats`

## TODO LATER

- TODO: Add Update IGDB token in CLI/tasks
- TODO: Update platform stats in CLI/tasks
- TODO: Add a Run All Scheduled Tasks in CLI/tasks
- TODO: Better admin panel (types, checks, zod, etc...)
- TODO: Add Dispatcher for Media Edit system (Extract etc...)
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
- TODO: type the APIs for the transformation of each media type and for search
- TODO: be more consistent on where I create the transformation (backend or frontend) for the stats  ("--" / null etc)
- TODO: Redo `logUpdate` using the `UpdateType` in each `mediaService`'s `calculateStats` method and then pass old and new values
  to `userMediaUpdates` service

## POTENTIAL TODO

- POTENTIAL TODO: Merge SeriesProvider and AnimeProvider
- POTENTIAL TODO: Abstract JobType (getMediaJobDetails, getSearchListFilters)
- POTENTIAL TODO: Abstract Repetitive Stat Calculation Logic (see if still true after adding every mediaType)