# MyLists TODO

## Logic (GET and mutations) implemented

- Profile page -> DONE
- Notifications -> DONE
- Coming Next -> DONE
- Hall of Fame -> DONE
- Search -> DONE
- Features -> DONE
- Achievements -> DONE
- Moviedle -> DONE
- Job Page -> DONE
- Media Details -> DONE
- Edit Media Details -> DONE
- Trending Page -> DONE
- MediaList Page -> DONE
- Settings Page ->
    - Add GET page -> DONE
    - Add General Settings -> DONE

## Backend Logic implemented

- Add `pino` logger -> DONE
- DB transaction system -> DONE
- Add `cache-manager` for in-memory and Redis cache -> DONE
- Add API rate limiting with `rate-limiter-flexible` -> DONE
- Add `redis` (for `cache-manager` and `rate-limiter-flexible`) -> DONE
- Create admin dashboard ->
    - Check users mediadle stats -> DONE
    - Update an achievement tier -> DONE
    - Allow to change user privacy -> DONE
    - Update an achievement definition -> DONE
    - Check specific user when was last active -> DONE
    - Activate/Deactivate the `new feature` flag -> DONE
    - Ability to change the active status of a user -> DONE
    - Check the cumulative number of users per month -> DONE
    - Execute long running tasks using admin dashboard -> DONE
    - Check how many users have a specific privacy value -> DONE
    - Check how many users where active in the last N days -> DONE
- Create small CLI for scheduled tasks ->
    - Vacuum db -> DONE
    - Analyze db -> DONE
    - Lock old movies -> DONE
    - Add bulk media refresh -> DONE
    - Seed database with achievements -> DONE
    - Update all the user's achievements -> DONE
    - Remove non-list media from database -> DONE
    - Add new media notifications to users -> DONE
    - Remove unused media covers from disk -> DONE
    - Compute user's stats (and time spent) per media type -> DONE

---

## Logic (GET and mutations) to implement

- Settings Page ->
    - Add List Settings ->
    - Add Password Settings ->
    - Add Delete User ->
- Platform Stats ->
    - Add GET page ->
    - Add cache system ->
- User stats page ->
    - Make it work (needs other mediaTypes, annoying) ->

## Backend Logic to implement

- Add `zod` validation on `createServerFn` functions
- Add rate limiter in `nginx` for prod (for spam protection)
- Add `ON CASCADE` for many things to avoid `FK` errors and simplify code
- Add global error handler (either monkey-patch or wait for TSS maintainers)

- Create admin dashboard
    - Delete users
- Create small CLI for scheduled tasks
    - Update IGDB token
    - Update platform stats
    - Run all scheduled tasks

- TODO: Add page results to search
- TODO: Add Labels to be returned in media lists
- TODO: Abstract JobType (if/else) with "strategy pattern" (see Gemini 2.5 pro on Google for details)
- TODO: Add Dispatcher for Media Edit system (Extract etc...)
- TODO: Remove countries in Anime in SideFilterSheet
- TODO: READ new better-sqlite3 - new dotenv - new recharts 3
- TODO: Create A 404 page and a 500 page for DefaultErrorBoundary

- POTENTIAL TODO: Merge SeriesProvider and AnimeProvider
- POTENTIAL TODO: Abstract Repetitive Stat Calculation Logic (see if still true after adding every mediaType)
