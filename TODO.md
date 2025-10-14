# MyLists TODO and FIXES

## KNOWN BUGS:

- KNOWN_BUG: When using `react-compiler` with `tanstack-table` selected rows and pages does not work.
- KNOWN_BUG: `redirect` does not work with function middlewares, need global middleware to manually re-throw error.

## TODO/FIXES

- TODO: changing name does not change directly, need to logout and login again
- TODO: Check how the bulk media refresh happens with new formatted errors etc...
- TODO: Tests when db empty
- TODO: Tests everything and all CLI tasks :(

## TODO AFTER PROD

- TODO: Add loading system like navbar search on search page
- TODO: Redo the Follows/Followers page in `profile` (very ugly in mobile and not great in desktop)
- TODO: Where possible directly use `queryOptions` instead of `queryKeys` in `useMutation` (better inference)
- TODO: `ProviderService` should use `BaseService` instead of `BaseRepository` directly (`updateMediaWithDetails` business logic for TV in Service)
