# MyLists TODO

## Logic (GET and mutations) to implement

- Settings Page
    - Add List Settings
    - Add Delete User
- Platform Media Stats
    - Add GET page
    - Add cache system
- User Media Stats page
    - Make it work (needs other mediaTypes)
- Missing mutations

## Backend Logic to implement

- Add rate limiter in `nginx` for prod (for spam protection)

- Create small CLI for scheduled tasks
    - Update IGDB token
    - Update platform stats
    - Run all scheduled tasks

- TODO: Better types for admin parts
- TODO: Add Dispatcher for Media Edit system (Extract etc...)
- TODO: Reduce number of useEffect if possible
- TODO: Check all `any` and `@ts-expect-error`
- TODO: Better admin panel (types, checks, zod, etc...)
- TODO: db error adding series to list
- TODO: db sqlite busy error when adding anything from search navbar
- TODO: refresh of anime does not seems to use jikan for the genres

- POTENTIAL TODO: Merge SeriesProvider and AnimeProvider
- POTENTIAL TODO: Abstract JobType (getMediaJobDetails, getSearchListFilters)
- POTENTIAL TODO: Abstract Repetitive Stat Calculation Logic (see if still true after adding every mediaType)
