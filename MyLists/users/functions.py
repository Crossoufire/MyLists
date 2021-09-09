from MyLists.models import get_models_type, BooksList, GamesList


def get_all_media_info(user):
    # Get the all media info in a dict for each media type
    list_models = get_models_type('List')

    each_media_data = []
    total_time = 0
    total_media = 0
    total_media_and_eps = 0
    total_score = 0
    total_mean_score = 0
    tmp = []
    total_time_by_media_type = []

    if not user.add_books:
        list_models.remove(BooksList)
    if not user.add_games:
        list_models.remove(GamesList)

    qte_media_type = len(list_models)
    for model in list_models:
        media_level, media_time = model.get_media_levels_and_time(user)
        media_count, total, nodata = model.get_media_count_by_status(user.id)
        media_total_eps = model.get_media_total_eps(user.id)
        media_favorites = model.get_favorites(user.id)
        if user.add_feeling:
            media_per_score = model.get_media_count_by_feeling(user.id)
            media_score = model.get_media_feeling(user.id)
        else:
            media_per_score = model.get_media_count_by_score(user.id)
            media_score = model.get_media_score(user.id)

        # Each <media_dict> dict contains the data for one media type (series, anime, movies, etc...)
        media_dict = {'time_hours': round(media_time/60), 'time_days': round(media_time/1440, 2),
                      'media_level': media_level, 'media_score': media_score, 'media_per_score': media_per_score,
                      'media_favorites': media_favorites, 'media': model.__name__.replace('List', ''),
                      'media_type': model.__name__.lower(), 'media_count': media_count,
                      'media_total_eps': media_total_eps, 'nodata': nodata, 'total': total}

        # Recover the total time for all media
        total_time += media_dict['time_hours']

        total_time_by_media_type.append(str(media_dict['time_hours']))

        # Recover total number of media
        total_media += media_dict['total']

        # Recover total number of media eps
        total_media_and_eps += media_dict['media_total_eps']

        # Recover the total score of all media
        total_score += media_dict['media_score']['scored_media']

        # Recover the total mean score of all media
        if user.add_feeling:
            tmp.append(media_per_score)
        else:
            try:
                total_mean_score += media_dict['media_score']['mean_score']
            except:
                qte_media_type -= 1

        each_media_data.append(media_dict)

    distrib_feels = []
    if user.add_feeling:
        distrib_feels = [sum(x) for x in zip(*tmp)]

    # Add global media info
    media_global = {'total_hours': total_time,
                    'total_media': total_media,
                    'total_time_by_media_type': ", ".join(total_time_by_media_type),
                    'total_media_and_eps': total_media_and_eps,
                    'total_score': total_score,
                    'distrib_feels': distrib_feels}
    try:
        media_global['total_mean_score'] = round(total_mean_score/qte_media_type, 2)
    except:
        media_global['total_mean_score'] = '-'

    return each_media_data, media_global
