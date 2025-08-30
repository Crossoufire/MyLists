# MyLists TODO and FIXES

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
- TODO: check edition of media type (all of them) in media details
- TODO: check list working correctly (all of them) like filters, status, and add from another list
- TODO: change UI apparance (tw3 to tw4 ^^)

## External TODO

- TODO: Create `cron` file for maintenance/scheduled tasks
- TODO: Add rate limiter in `nginx` for prod (for spam protection)
