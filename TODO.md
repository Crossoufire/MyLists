# MyLists TODO and FIXES

## Fixes

## TODO

- TODO: check any errors and bugs etc...
- TODO: better organization of the code in mediaDetails and listDetails so i don't need to pass pages, or chapters to userMedia
  for that i would need a context or zustand maybe to pass the data better without infinite prop drilling or maybe do 2 different call one for the
  details/list and one for the userMedia data. in details it can be called as parralele to avoid waterfall loading. For list it could be
  done using intent on the hovering of the top right corner to get the data fast (still need to show most of them on the card tho so
  I still need some zustand or something to show the appropriate value of page/chapters if I want to show 157/186 and not just 157)
- TODO: better createListFilters, and jobDefinitions etc... (it is a bit all over the place and hard to understand)
- TODO: Check on `any`, `@ts-expect-error`, `Record<string, any>`, etc...

## External TODO

- TODO: Add rate limiter in `nginx` for prod (for spam protection)
- TODO: Create `cron` file for maintenance/scheduled tasks
