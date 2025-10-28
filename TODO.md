# MyLists TODO and FIXES

## KNOWN BUGS:

- KNOWN_BUG: When using `react-compiler` with `tanstack-table` selected rows and pages does not work.
- KNOWN_BUG: `redirect` does not work with function middlewares, need global middleware to manually re-throw error.

## TODO/FIXES

- TODO: Finish consolidate task interface between admin and users
- TODO: Continue implementation of upload CSV

## TODO AFTER PROD

- TODO: Finish User Media display in admin dashboard
- TODO: Add a command to create a user programmatically
- TODO: Add loading system like navbar search on search page
- TODO: Redo the Follows/Followers page in `profile` (very ugly in mobile and not great in desktop)
- TODO: Put the createUser command in the admin dashboard, but in a new menu that can take arguments
- TODO: Where possible directly use `queryOptions` instead of `queryKeys` in `useMutation` (better inference)
- TODO: `ProviderService` should use `BaseService` instead of `BaseRepository` directly (`updateMediaWithDetails` business logic for TV in Service)
