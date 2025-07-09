-- =========================
-- user table
-- =========================
UPDATE user SET role = 'manager' WHERE role = 'MANAGER';
UPDATE user SET role = 'user' WHERE role = 'USER';
UPDATE user SET privacy = 'public' WHERE privacy = 'PUBLIC';
UPDATE user SET privacy = 'restricted' WHERE privacy = 'RESTRICTED';
UPDATE user SET privacy = 'private' WHERE privacy = 'PRIVATE';
UPDATE user SET search_selector = 'tmdb' WHERE search_selector = 'TMDB';
UPDATE user SET search_selector = 'books' WHERE search_selector = 'BOOKS';
UPDATE user SET search_selector = 'igdb' WHERE search_selector = 'IGDB';
UPDATE user SET search_selector = 'manga' WHERE search_selector = 'MANGA';
UPDATE user SET search_selector = 'users' WHERE search_selector = 'USERS';
UPDATE user SET rating_system = 'score' WHERE rating_system = 'SCORE';
UPDATE user SET rating_system = 'feeling' WHERE rating_system = 'FEELING';

-- =========================
-- user_media_update table
-- =========================
UPDATE user_media_update SET media_type = 'series' WHERE media_type = 'SERIES';
UPDATE user_media_update SET media_type = 'anime' WHERE media_type = 'ANIME';
UPDATE user_media_update SET media_type = 'movies' WHERE media_type = 'MOVIES';
UPDATE user_media_update SET media_type = 'games' WHERE media_type = 'GAMES';
UPDATE user_media_update SET media_type = 'books' WHERE media_type = 'BOOKS';
UPDATE user_media_update SET media_type = 'manga' WHERE media_type = 'MANGA';
UPDATE user_media_update SET update_type = 'tv' WHERE update_type = 'TV';
UPDATE user_media_update SET update_type = 'page' WHERE update_type = 'PAGE';
UPDATE user_media_update SET update_type = 'redo' WHERE update_type = 'REDO';
UPDATE user_media_update SET update_type = 'status' WHERE update_type = 'STATUS';
UPDATE user_media_update SET update_type = 'redoTv' WHERE update_type = 'REDOTV';
UPDATE user_media_update SET update_type = 'chapter' WHERE update_type = 'CHAPTER';
UPDATE user_media_update SET update_type = 'playtime' WHERE update_type = 'PLAYTIME';

-- =========================
-- notifications table
-- =========================
UPDATE notifications SET media_type = 'series' WHERE media_type = 'SERIES';
UPDATE notifications SET media_type = 'anime' WHERE media_type = 'ANIME';
UPDATE notifications SET media_type = 'movies' WHERE media_type = 'MOVIES';
UPDATE notifications SET media_type = 'games' WHERE media_type = 'GAMES';
UPDATE notifications SET media_type = 'books' WHERE media_type = 'BOOKS';
UPDATE notifications SET media_type = 'manga' WHERE media_type = 'MANGA';
UPDATE notifications SET notification_type = 'tv' WHERE notification_type = 'TV';
UPDATE notifications SET notification_type = 'media' WHERE notification_type = 'MEDIA';
UPDATE notifications SET notification_type = 'follow' WHERE notification_type = 'FOLLOW';

-- =========================
-- achievement_tier table
-- =========================
UPDATE achievement_tier SET difficulty = 'bronze' WHERE difficulty = 'BRONZE';
UPDATE achievement_tier SET difficulty = 'silver' WHERE difficulty = 'SILVER';
UPDATE achievement_tier SET difficulty = 'gold' WHERE difficulty = 'GOLD';
UPDATE achievement_tier SET difficulty = 'platinum' WHERE difficulty = 'PLATINUM';

-- =========================
-- achievement table
-- =========================
UPDATE achievement SET media_type = 'series' WHERE media_type = 'SERIES';
UPDATE achievement SET media_type = 'anime' WHERE media_type = 'ANIME';
UPDATE achievement SET media_type = 'movies' WHERE media_type = 'MOVIES';
UPDATE achievement SET media_type = 'games' WHERE media_type = 'GAMES';
UPDATE achievement SET media_type = 'books' WHERE media_type = 'BOOKS';
UPDATE achievement SET media_type = 'manga' WHERE media_type = 'MANGA';

-- =========================
-- daily_mediadle table
-- =========================
UPDATE daily_mediadle SET media_type = 'series' WHERE media_type = 'SERIES';
UPDATE daily_mediadle SET media_type = 'anime' WHERE media_type = 'ANIME';
UPDATE daily_mediadle SET media_type = 'movies' WHERE media_type = 'MOVIES';
UPDATE daily_mediadle SET media_type = 'games' WHERE media_type = 'GAMES';
UPDATE daily_mediadle SET media_type = 'books' WHERE media_type = 'BOOKS';
UPDATE daily_mediadle SET media_type = 'manga' WHERE media_type = 'MANGA';

-- =========================
-- mediadle_stats table
-- =========================
UPDATE mediadle_stats SET media_type = 'series' WHERE media_type = 'SERIES';
UPDATE mediadle_stats SET media_type = 'anime' WHERE media_type = 'ANIME';
UPDATE mediadle_stats SET media_type = 'movies' WHERE media_type = 'MOVIES';
UPDATE mediadle_stats SET media_type = 'games' WHERE media_type = 'GAMES';
UPDATE mediadle_stats SET media_type = 'books' WHERE media_type = 'BOOKS';
UPDATE mediadle_stats SET media_type = 'manga' WHERE media_type = 'MANGA';

-- =========================
-- manga_list table
-- =========================
UPDATE manga_list SET status = 'Reading' WHERE status = 'READING';
UPDATE manga_list SET status = 'Playing' WHERE status = 'PLAYING';
UPDATE manga_list SET status = 'Watching' WHERE status = 'WATCHING';
UPDATE manga_list SET status = 'Completed' WHERE status = 'COMPLETED';
UPDATE manga_list SET status = 'Multiplayer' WHERE status = 'MULTIPLAYER';
UPDATE manga_list SET status = 'Endless' WHERE status = 'ENDLESS';
UPDATE manga_list SET status = 'On Hold' WHERE status = 'ON_HOLD';
UPDATE manga_list SET status = 'Random' WHERE status = 'RANDOM';
UPDATE manga_list SET status = 'Dropped' WHERE status = 'DROPPED';
UPDATE manga_list SET status = 'Plan to Watch' WHERE status = 'PLAN_TO_WATCH';
UPDATE manga_list SET status = 'Plan to Play' WHERE status = 'PLAN_TO_PLAY';
UPDATE manga_list SET status = 'Plan to Read' WHERE status = 'PLAN_TO_READ';

-- =========================
-- movies_list table
-- =========================
UPDATE movies_list SET status = 'Reading' WHERE status = 'READING';
UPDATE movies_list SET status = 'Playing' WHERE status = 'PLAYING';
UPDATE movies_list SET status = 'Watching' WHERE status = 'WATCHING';
UPDATE movies_list SET status = 'Completed' WHERE status = 'COMPLETED';
UPDATE movies_list SET status = 'Multiplayer' WHERE status = 'MULTIPLAYER';
UPDATE movies_list SET status = 'Endless' WHERE status = 'ENDLESS';
UPDATE movies_list SET status = 'On Hold' WHERE status = 'ON_HOLD';
UPDATE movies_list SET status = 'Random' WHERE status = 'RANDOM';
UPDATE movies_list SET status = 'Dropped' WHERE status = 'DROPPED';
UPDATE movies_list SET status = 'Plan to Watch' WHERE status = 'PLAN_TO_WATCH';
UPDATE movies_list SET status = 'Plan to Play' WHERE status = 'PLAN_TO_PLAY';
UPDATE movies_list SET status = 'Plan to Read' WHERE status = 'PLAN_TO_READ';

-- =========================
-- games_list table
-- =========================
UPDATE games_list SET status = 'Reading' WHERE status = 'READING';
UPDATE games_list SET status = 'Playing' WHERE status = 'PLAYING';
UPDATE games_list SET status = 'Watching' WHERE status = 'WATCHING';
UPDATE games_list SET status = 'Completed' WHERE status = 'COMPLETED';
UPDATE games_list SET status = 'Multiplayer' WHERE status = 'MULTIPLAYER';
UPDATE games_list SET status = 'Endless' WHERE status = 'ENDLESS';
UPDATE games_list SET status = 'On Hold' WHERE status = 'ON_HOLD';
UPDATE games_list SET status = 'Random' WHERE status = 'RANDOM';
UPDATE games_list SET status = 'Dropped' WHERE status = 'DROPPED';
UPDATE games_list SET status = 'Plan to Watch' WHERE status = 'PLAN_TO_WATCH';
UPDATE games_list SET status = 'Plan to Play' WHERE status = 'PLAN_TO_PLAY';
UPDATE games_list SET status = 'Plan to Read' WHERE status = 'PLAN_TO_READ';

-- platform column
UPDATE games_list SET platform = 'PC' WHERE platform = 'PC';
UPDATE games_list SET platform = 'Android' WHERE platform = 'ANDROID';
UPDATE games_list SET platform = 'Iphone' WHERE platform = 'IPHONE';
UPDATE games_list SET platform = 'Playstation 5' WHERE platform = 'PLAYSTATION_5';
UPDATE games_list SET platform = 'Playstation 4' WHERE platform = 'PLAYSTATION_4';
UPDATE games_list SET platform = 'Playstation 3' WHERE platform = 'PLAYSTATION_3';
UPDATE games_list SET platform = 'Playstation 2' WHERE platform = 'PLAYSTATION_2';
UPDATE games_list SET platform = 'Playstation' WHERE platform = 'PLAYSTATION';
UPDATE games_list SET platform = 'PSP' WHERE platform = 'PSP';
UPDATE games_list SET platform = 'PS Vita' WHERE platform = 'PS_VITA';
UPDATE games_list SET platform = 'Xbox Series' WHERE platform = 'XBOX_SERIES';
UPDATE games_list SET platform = 'Xbox One' WHERE platform = 'XBOX_ONE';
UPDATE games_list SET platform = 'Xbox 360' WHERE platform = 'XBOX_360';
UPDATE games_list SET platform = 'Xbox' WHERE platform = 'XBOX';
UPDATE games_list SET platform = 'Switch 2' WHERE platform = 'NINTENDO_SWITCH_2';
UPDATE games_list SET platform = 'Switch' WHERE platform = 'NINTENDO_SWITCH';
UPDATE games_list SET platform = 'Wii U' WHERE platform = 'WII_U';
UPDATE games_list SET platform = 'Wii' WHERE platform = 'WII';
UPDATE games_list SET platform = 'Gamecube' WHERE platform = 'GAMECUBE';
UPDATE games_list SET platform = 'Nintendo 64' WHERE platform = 'NINTENDO_64';
UPDATE games_list SET platform = 'SNES' WHERE platform = 'SNES';
UPDATE games_list SET platform = 'NES' WHERE platform = 'NES';
UPDATE games_list SET platform = 'Nintendo 3DS' WHERE platform = 'NINTENDO_3DS';
UPDATE games_list SET platform = 'Nintendo DS' WHERE platform = 'NINTENDO_DS';
UPDATE games_list SET platform = 'GB Advance' WHERE platform = 'GAME_BOY_ADVANCE';
UPDATE games_list SET platform = 'GB Color' WHERE platform = 'GAME_BOY_COLOR';
UPDATE games_list SET platform = 'Game Boy' WHERE platform = 'GAME_BOY';
UPDATE games_list SET platform = 'Arcade' WHERE platform = 'ARCADE';
UPDATE games_list SET platform = 'Old Sega' WHERE platform = 'OLD_SEGA_CONSOLE';
UPDATE games_list SET platform = 'Old Atari' WHERE platform = 'OLD_ATARI_CONSOLE';
UPDATE games_list SET platform = 'Other' WHERE platform = 'OTHER';

-- =========================
-- books_list table
-- =========================
UPDATE books_list SET status = 'Reading' WHERE status = 'READING';
UPDATE books_list SET status = 'Playing' WHERE status = 'PLAYING';
UPDATE books_list SET status = 'Watching' WHERE status = 'WATCHING';
UPDATE books_list SET status = 'Completed' WHERE status = 'COMPLETED';
UPDATE books_list SET status = 'Multiplayer' WHERE status = 'MULTIPLAYER';
UPDATE books_list SET status = 'Endless' WHERE status = 'ENDLESS';
UPDATE books_list SET status = 'On Hold' WHERE status = 'ON_HOLD';
UPDATE books_list SET status = 'Random' WHERE status = 'RANDOM';
UPDATE books_list SET status = 'Dropped' WHERE status = 'DROPPED';
UPDATE books_list SET status = 'Plan to Watch' WHERE status = 'PLAN_TO_WATCH';
UPDATE books_list SET status = 'Plan to Play' WHERE status = 'PLAN_TO_PLAY';
UPDATE books_list SET status = 'Plan to Read' WHERE status = 'PLAN_TO_READ';

-- =========================
-- anime_list table
-- =========================
UPDATE anime_list SET status = 'Reading' WHERE status = 'READING';
UPDATE anime_list SET status = 'Playing' WHERE status = 'PLAYING';
UPDATE anime_list SET status = 'Watching' WHERE status = 'WATCHING';
UPDATE anime_list SET status = 'Completed' WHERE status = 'COMPLETED';
UPDATE anime_list SET status = 'Multiplayer' WHERE status = 'MULTIPLAYER';
UPDATE anime_list SET status = 'Endless' WHERE status = 'ENDLESS';
UPDATE anime_list SET status = 'On Hold' WHERE status = 'ON_HOLD';
UPDATE anime_list SET status = 'Random' WHERE status = 'RANDOM';
UPDATE anime_list SET status = 'Dropped' WHERE status = 'DROPPED';
UPDATE anime_list SET status = 'Plan to Watch' WHERE status = 'PLAN_TO_WATCH';
UPDATE anime_list SET status = 'Plan to Play' WHERE status = 'PLAN_TO_PLAY';
UPDATE anime_list SET status = 'Plan to Read' WHERE status = 'PLAN_TO_READ';

-- =========================
-- series_list table
-- =========================
UPDATE series_list SET status = 'Reading' WHERE status = 'READING';
UPDATE series_list SET status = 'Playing' WHERE status = 'PLAYING';
UPDATE series_list SET status = 'Watching' WHERE status = 'WATCHING';
UPDATE series_list SET status = 'Completed' WHERE status = 'COMPLETED';
UPDATE series_list SET status = 'Multiplayer' WHERE status = 'MULTIPLAYER';
UPDATE series_list SET status = 'Endless' WHERE status = 'ENDLESS';
UPDATE series_list SET status = 'On Hold' WHERE status = 'ON_HOLD';
UPDATE series_list SET status = 'Random' WHERE status = 'RANDOM';
UPDATE series_list SET status = 'Dropped' WHERE status = 'DROPPED';
UPDATE series_list SET status = 'Plan to Watch' WHERE status = 'PLAN_TO_WATCH';
UPDATE series_list SET status = 'Plan to Play' WHERE status = 'PLAN_TO_PLAY';
UPDATE series_list SET status = 'Plan to Read' WHERE status = 'PLAN_TO_READ';

-- =========================
-- user_media_settings table
-- =========================
UPDATE user_media_settings SET media_type = 'series' WHERE media_type = 'SERIES';
UPDATE user_media_settings SET media_type = 'anime' WHERE media_type = 'ANIME';
UPDATE user_media_settings SET media_type = 'movies' WHERE media_type = 'MOVIES';
UPDATE user_media_settings SET media_type = 'games' WHERE media_type = 'GAMES';
UPDATE user_media_settings SET media_type = 'books' WHERE media_type = 'BOOKS';
UPDATE user_media_settings SET media_type = 'manga' WHERE media_type = 'MANGA';