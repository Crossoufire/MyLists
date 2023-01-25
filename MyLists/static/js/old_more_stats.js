
// --- Media genres container size ------------------------------------------------------------------------
let series_height = 40*series_genres_data.length + 'px';
let anime_height = 40*anime_genres_data.length + 'px';

$('.series-genres-container').attr('style', 'height:' +series_height+';');
$('.anime-genres-container').attr('style', 'height:' +anime_height+';');
