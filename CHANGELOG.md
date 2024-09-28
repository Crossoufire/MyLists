## CHANGELOG v2.1.0
---

### Under the Hood

- Add `Redis-Server` to the backend
- Add `Flask-Limiter` to the backend
- Use Redis for `Flask-Cache`
- Add `gzip` compression with `nginx` for json responses
- Replace `datetime.utcnow` (deprecated python 3.12)

### Features

- Add privacy modes (`restricted` and `public`) `private` mode soon&trade;
- Add `authors` to the book edition (in `/details`) (`manager` only)

### Fixes

- Fix tv refresh data from TMDB
- Fix changing a season was not resetting the episodes dropdown to 1 (in `/details` and `/list`)
- Fix possible to edit history when not current user (in `/profile`)
- Fix E00 for tv shows (in `/details` and `/list`)
- Fix oAuth2 new username could have > 14 characters
- Fix no Stale-While-Revalidate for the `/list` page
- Fix browser history and edit media (`/details`)
- Fix correct % of non-rated media in `/profile` (do not take into account the `plan to X` media)

## CHANGELOG v2.0.0
---

### Under the Hood

- Very large amount of backend code refactoring and database schemas refactoring (> 15 db migrations!)
- Add `Vaccum` and `Analyze` commands in the flask CLI to optimize the SQLite database
- Add new flask CLI command to remove non-activated user > 7 days
- Add marshmallow schemas for input validation in the backend
- Add `tanstack query` (useQuery + mutations) for every API call in the frontend
- Add local cache mutations using `tanstack query` for faster loading
- Better error handling in the backend and the frontend
- Better mails sending based on error type
- Now `poetry` is used to manage the backend dependencies
- Add `Tanstack Table` for the table view in `/list` and the `/history` page
- Update all dependencies (backend and frontend)

### Features

- Possibility to delete media updates (in `/history`, `/details`, and `/profile`)
- Media List CSV Export (in `/settings`)
- Add played game platform (in `/details`) and stats (in `/stats`)
- Advanced Media List Filtering (in `/list`)
- Toggle Table/Grid View (in `/list`)
- When refreshing the details of a media (`managers` only), all the details are updated
- Add a 'tab reminder' for the `/coming-next` page and the `/trends` page
- Add a new `Features` page (in `/features`)

### UI Modifications

- Add Table View to the Media List (in `/list`)
- Removed frames around profile pictures (in `/profile` and `/hall-of-fame`)
- Removed the icons for the media levels (in `/profile` and `/hall-of-fame`)
- Redesigned the error page/component
- Changed the emails templates (account activation, password reset)
- Add `GitHub Changelog` in the footer
- Level is shown in the `/list` page

### Fixes

- Fix padding on stats cards in `/stats` in ipad landscape mode
- Removed `comments` as a sorting option in `/list` (added it in the advanced filter)
- Fix scrollbar in the filters side sheet in `/list`
- Fix sorting Plan to X by release dates in `/coming-next`
- Fix potential bug in oAuth2 authentication (username could be not unique)

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
