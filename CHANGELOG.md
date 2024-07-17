## CHANGELOG v1.4.1
---
### Under the Hood
- Improved UI performance and backend of `/list`
- Updated the `package.json` dependencies

### Features
- Added the option for the users to compare their stats with another user in `/stats` (alpha)

### UI Modifications
- Removed the misc sidebar and added cards carousel to the main stats in `/stats`
- Changed TMDB to IGDB for games in `/details`
- Changed Top Watched to Top Read for Books and Top Played for Games in `/stats`

### Fixes
- Fixed error in user last updates in `/profile`


## CHANGELOG v1.4.0
---
### Under the Hood
- Created different user routes settings in backend
- Misc refactoring backend
- Cleaned frontend components
- Add backend unit tests (5/11)
- Replaced React-router by TanStack Router (change the loading page behavior)
- Replaced Recharts with Nivo (reduce bundle size)

### Features
- Added a dedicated stats page for each user in `/stats/<media_type>/<username>`
- Added a present in list media checkmark for creator/actor/network etc... on `/details`
- Added a 20 min long-polling for the notifications system

### UI Modifications
- Re-created the `/settings` UI
- Re-created the `/list` interface completely
- Re-created the media cards in `/coming_next` and `/details/jobs` with the same style as `/list`
- Created a LabelManager, accessible in `/details` and `/list`
- Better edit forms in `/details/form`
- Removed ":" for the follow cards in `/details`

### Fixes
- Fix subtle errors for 401 Unauthorized errors
- Fix can add two times a label for the same media in `/details`
- Fix comments on `/lists`: subtle bad behaviors + no saving
- Fix Seasons and episodes in `/lists` and `/details`
- Fix books: avoid update page if page did not change
- Fix some frontend React keys and nested a/button warnings
- Fix cache and now using SystemFileCache instead of memory

## CHANGELOG v1.3.1
---
### Fixes
- Fix the refresh date inconsistency in `/details` by creating a proper `last_api_update` for Series, Anime, Movies, and Games models
- Fix the issue with Right Full Outer Join for users using the feeling ratings in `/profile`
- Fix the UI of media items in `/coming_next`
- Fix the requirement to activate books list in `/settings` to enable the game search functionality


## CHANGELOG v1.3.0
---
### Under the Hood
- Small backend refactoring
- Created reusable components for clarity

### Features
- Added a sorting per mediaType in `/HoF`
- Added the next airing information in TV `/details`
- Added a `Finale` badge in TV notifications for season conclusion
- Added a refresh date in the refresh icon on `/details` (only for `managers`)

### UI Modifications
- Added new logo for MyLists
- Refined the 3 dots UI in each media item within `/lists`
- Changed editable text for comments in `lists`

### Fixes
- Fix ErrorPage was always 404
- Fix the display of `All(x)` for the total numbers of follows in `/profile`
- Fix too long username in updates in `/profile`
- Fix small issues in mobile view:
  - Tabs were too large in `/coming_next`
  - Tabs were not centered in `/trends`
  - `Plan to Watch` text was too long in `/profile` 
  - Impossible to scroll the notifications in the Sheet navbar

## CHANGELOG v1.2.0
---
### Under the Hood
- Added Tailwind CSS
- Replaced Bootstrap by Shadcn-UI
- Moved from Create React App_old (CRA) to Vite with react plugin

### Features
- Implemented OAuth2 authentication: GitHub and Google
- Added `React-Helmet` to manage metadata in the header
- Removed the changelog in the website (not a fan)

### UI Modifications
- Redefined the table layout in `profile/history` for simplicity and reduced dependencies
- Transformed horizontal navbar sheet in mobile view to vertical one covering the entire screen
- Modified `/details` with new tabs for `history` and `follows`
- Adjusted precision of the airing dates in TV and Anime in `/details`
- Sorted labels alphabetically in `/list` and in `/profile`
- Renamed "score" and "feeling" names to "rating" for clarity and simplicity


## CHANGELOG v1.1.0
---
### Under the Hood
- Typos
- Small fixes and ESLint
- Replaced private and public route component with Higher Order Function (HOF)
- Added a new very short live token for admin elevation (5 minutes)
- Improved the clicked outside hook
- Changed some functions to variable holding functions

### Code Refactoring (backend)
- Split blueprints for visibility and readability (split `media` and created: `lists` and `details`)

### UI Modification
- Corrected `profile` and `notification` dropdown overflow 

### New Features
- Added a `label system` for each type of media: you can now add labels to every media to group them together as you which
- Added very simple `Admin` user management
- User can now delete their own account (finally!)
- Added db migration using `flask-migrate` (finally!)


&nbsp;
## CHANGELOG v1.0.1
---
### Under the Hood
- Overhauled (a bit) the code for the stats graphs in `/list/stats`.
- Standardized `comment` in `/list` and `/details`.
- Transitioned from an `onClick` to a `Link` for `/trends` and `/search`.
- Implemented a `collapseHook` for the profile components.
- Added the SWR library to optimize data fetching and caching.
- Removed `react-tooltip` dependency and use the tooltips of `react-bootstrap`.
- Removed `react-minimal-pie-chart` dependency and use `recharts` only.
- Code refactoring to enhance overall code quality.

### UI Modification Desktop
- Adjusted text and graph colors of the media stats in `/list/stats`
- Adjusted graph label in `/global_stats` navbar.
- Enabled middle mouse button to open media in new tab for `/search` and `/trends`.
- Modified `x` icon in the `/search` navbar.
- Revamped the display of the profile media with tabbed layout in `/profile`.
- Added a `confirmationHook` to prompt confirmation before deleting a media in `/list` and `/details`.

### UI Modification Mobile
- Navigation hamburger now retract upon loading a Link.

### Code Refactoring (backend)
- Refactored the stats code of the `/medialist` route.
- Refactored the `/profile` route and associated functions for the new tabbed media display.
- Removed the custom SSL SMTP Handler, allowing for TLS only.
- Code refactoring to enhance overall code quality.

### Bug Fixes
- Fixed an issue with user `/search` in navbar: inability to access the other pages.
- Fixed wrong Notifications media name for games.

### Other
- Merged the `/add_media_to_db` route with the `/details` route for the use of Link instead of onClick in the frontend.
- Implemented a personalized error message using Flask's abort for the `TMDB API`.
- Introduced a `classes` folder for better code organization.
- Changed cookies settings for the refresh token
