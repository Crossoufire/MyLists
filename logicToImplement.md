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
    - Add history GET and mutation -> DONE
    - Add media to list mutation -> DONE
    - Add redo mutation -> DONE
    - Add comments mutation -> DONE
    - Add status mutation -> DONE
    - Add favorite mutation -> DONE
    - Add remove from list mutation -> DONE
    - Add rating mutation -> DONE
    - Add labels GET + mutations -> DONE
    - Add refresh mutation -> DONE
- Edit Media Details -> DONE
    - Add GET page -> DONE
    - Add edit mutation -> DONE
- Trending Page ->
    - Add GET page -> DONE

## Backend Logic implemented

- DB transaction system -> DONE
- Create small CLI for scheduled tasks -> DONE
    - Add bulk media refresh -> DONE

---

## Logic (GET and mutations) to implement

- Trending Page ->
    - Add cache system
- Platform Stats ->
    - Add GET page
    - Add cache system
- MediaList Page ->
    - Add table view
    - Fix filters
    - Fix currentUser checking
    - Add update media system
- User stats page ->
    - Make it work (needs other mediaTypes, annoying)

## Backend Logic to implement

- Add `zod` or `valibot` on 'all' serverFunctions
- Add `redis` (for cache and `rate-limiter-flexible`)
- Add global error handler
- Add rate limiter in `nginx` (for flood protection)
- Replace `p-throttle` with `rate-limiter-flexible` for API rate limiting
- Create admin dashboard
    - Allow to change the user privacy
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
    - Add update IGDB tokens
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
