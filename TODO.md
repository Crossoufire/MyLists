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

## Backend Logic to implement

- Add `zod` validation on `createServerFn` functions
- Add rate limiter in `nginx` for prod (for spam protection)
- Add `ON CASCADE` for many things to avoid `FK` errors and simplify code

- Create admin dashboard
    - Delete users
- Create small CLI for scheduled tasks
    - Update IGDB token
    - Update platform stats
    - Run all scheduled tasks

- TODO: Add Dispatcher for Media Edit system (Extract etc...)
- TODO: Create a 500 page from DefaultErrorBoundary
- TODO: Check external=true external=false search

- POTENTIAL TODO: Merge SeriesProvider and AnimeProvider
- POTENTIAL TODO: Abstract JobType (getMediaJobDetails, getSearchListFilters)
- POTENTIAL TODO: Abstract Repetitive Stat Calculation Logic (see if still true after adding every mediaType)

Create different types of error in Global error handler middleware:

- If error is `notFound` or `FormattedError` or `FormZodError` -> just throw the error (format already ok).
- If error is `z.ZodError` -> throw new Error("A validation error occurred") and send a mail.
- If error is anything else -> throw new Error("An Unexpected error occurred") and send a mail.
- Need to create a `FormattedError` instance for, well, expected error like "media already in your list".
- Need to create a wrapper arround ZodError for Form server function -> Return error to user for display on form.
