# MyLists TODO and FIXES

## Fixes

- FIX: Top rated dev and publishers stats in games bug

## TODO

- TODO: Add GET page in `PlatformStats`
- TODO: Add cache system in `PlatformStats`
- TODO: [~DONE] Make User Media Stats page work
- TODO: Add `totalUsers` for `globalStats` in platform
- TODO: change original name to english name when not latin in search
- TODO: `statsPage`: send user's settings to add activated mediaTypes in sidebar
- TODO: add `onCascade` for media removal from list (and simplify functions accordingly)

## TODO LATER

- TODO: Add Update IGDB token in CLI/tasks
- TODO: Update platform stats in CLI/tasks
- TODO: Add a Run All Scheduled Tasks in CLI/tasks
- TODO: Better admin panel (types, checks, zod, etc...)
- TODO: Add Dispatcher for Media Edit system (Extract etc...)
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
- TODO: type the APIs for the transformation of each media type and for search
- TODO: be more logical on where I create the transformation (backend or frontend) for the stats  ("--" / null etc)
- TODO: Redo `logUpdate` using the `UpdateType` in each `mediaService`'s `calculateStats` method and then pass old and new values
  to `userMediaUpdates` service

## POTENTIAL TODO

- POTENTIAL TODO: Merge SeriesProvider and AnimeProvider
- POTENTIAL TODO: Abstract JobType (getMediaJobDetails, getSearchListFilters)
- POTENTIAL TODO: Abstract Repetitive Stat Calculation Logic (see if still true after adding every mediaType)