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
- Settings Page ->
    - Add GET page -> DONE

## Backend Logic implemented

- Add `pino` logger -> DONE
- DB transaction system -> DONE
- Add `cache-manager` for in-memory and Redis cache -> DONE
- Add API rate limiting with `rate-limiter-flexible` -> DONE
- Add `redis` (for `cache-manager` and `rate-limiter-flexible`) -> DONE
- Create admin dashboard ->
    - Allow to change user privacy -> DONE
    - Check specific user when was last active -> DONE
    - Activate/Deactivate the `new feature` flag -> DONE
    - Check the cumulative number of users per month -> DONE
    - Check how many users have a specific privacy value -> DONE
    - Check how many users where active in the last N days -> DONE
    - Ability to change the active status of a user (disable account) -> DONE
- Create small CLI for scheduled tasks ->
    - Add bulk media refresh -> DONE

---

## Logic (GET and mutations) to implement

- Settings Page ->
    - Add all settings mutation
- MediaList Page ->
    - Fix filters
    - Add table view
    - Add update media system
    - Fix currentUser checking
- Platform Stats ->
    - Add GET page
    - Add cache system
- User stats page ->
    - Make it work (needs other mediaTypes, annoying)

## Backend Logic to implement

- Add `zod` validation on `createServerFn` functions
- Add rate limiter in `nginx` (for flood/spamming protection)
- Add global error handler (either monkey-patch or wait for TSS maintainers)
- Create admin dashboard
    - Delete users
    - Update an achievement tier
    - Update an achievement definition
    - Check mediadle stats of all/speicific users
    - Execute long running tasks from CLI using admin dashboard
- Create small CLI for scheduled tasks
    - Vacuum db
    - Analyze db
    - Lock old movies
    - Update IGDB token
    - Update platform stats
    - Run all scheduled tasks
    - Create demo user account
    - Update all the user's achievements
    - Compute user's stats per media type
    - Seed the database with achievements
    - Remove unused media covers from disk
    - Add new media notifications to users
    - Remove non-list media from the database
    - Lock media that are not available in the provider
    - Compute media time spent per user and per media type
