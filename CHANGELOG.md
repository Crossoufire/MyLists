
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
