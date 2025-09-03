# MyLists TODO and FIXES

## KNOWN BUGS:

- BUG: When using react compiler selected rows does not work (same for pages)

## Fixes

- FIX: changing name when using oAuth ONLY does not change directly, need to logout and login again
- FIX: problem with "default.jpg" should be an url not just a string to work properly
- MEDIALIST MOVIES:
    - FIX: pagination pages in table mode does not work
    - FIX: button status filters does not work in media list
    - FIX: Better name for languages in the filter (Thai is th, or spanish is sh for example)
    - FIX: Labels system does not work. But when going on media details, it works (so just a display bug I guess)
- MEDIA DETAILS:
    - FIX: Bug with labels when adding deleting from media (when deleting from media, the label is sometimes duplicated)

## TODO

- TODO: Implement forgot password
- TODO: Re-implement UI apparance (tw3 to tw4 ^^)
- TODO: where possible use directly the queryOption instead of queryKeys in useMutations (better for inference)

## External TODO

- TODO: Create `cron` file for maintenance/scheduled tasks
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
