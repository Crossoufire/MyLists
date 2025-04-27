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
- Create small CLI for scheduled tasks -> DONE
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
    - Allow to change user privacy
    - Check how many users where active in the last N days
    - Check how many users have a specific privacy value
    - Ability to change the active status of a user (disable account) -> different from a ban
    - Check specific user when was last active
    - Delete users
    - Activate/Deactivate the `new feature` flag
    - Check the cumulative number of users per month
    - Update an achievement definition
    - Update an achievement tier
    - Check mediadle stats of all/speicific users
- Create small CLI for scheduled tasks (what is made in CLI could be available in the admin dashboard)
    - Create demo user account
    - Seed the database with achievements
    - Update all the user's achievements
    - Remove non-list media from the database
    - Remove unused media covers from disk
    - Add new media notifications to users
    - Lock media that are not available in the provider
    - Lock old movies
    - Compute media time spent per user and per media type
    - Compute user's stats per media type
    - Analyze db
    - Vacuum db
    - Update platform stats
    - Update IGDB token
    - Run all scheduled tasks
