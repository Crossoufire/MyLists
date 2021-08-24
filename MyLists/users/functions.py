from MyLists.models import get_models_type, BooksList, GamesList


def get_all_media_info(user):
    # Get the all media info in a dict for each media type
    list_models = get_models_type('List')
    media_dict, total_time, total_media, total_media_and_eps, total_score, total_mean_score, tmp = {}, 0, 0, 0, 0, 0, []

    if not user.add_books:
        list_models.remove(BooksList)
    if not user.add_games:
        list_models.remove(GamesList)

    qte_media_type = len(list_models)
    for model in list_models:
        media_count = model.get_media_count_by_status(user.id)
        media_levels, media_time = model.get_media_levels_and_time(user)
        media_total_eps = model.get_media_total_eps(user.id)
        media_favorites = model.get_favorites(user.id)
        if user.add_feeling:
            media_count_score = model.get_media_count_by_feeling(user.id)
            media_score = model.get_media_feeling(user.id)
        else:
            media_count_score = model.get_media_count_by_score(user.id)
            media_score = model.get_media_score(user.id)

        # Each <media_data> dict contains all the data for one media type
        media_data = {'time_spent_hour': round(media_time/60), 'time_spent_day': round(media_time/1440, 2),
                      'media_count': media_count, 'media_count_score': media_count_score,
                      'media_total_eps': media_total_eps, 'media_levels': media_levels,
                      'media_score': media_score, 'media_favorites': media_favorites}

        # Recover the total time for all <media>
        total_time += media_data['time_spent_hour']

        # Recover total number of <media>
        total_media += media_data['media_count']['total']

        # Recover total number of <media>
        total_media_and_eps += media_data['media_total_eps']

        # Recover the total score of all <media>
        total_score += media_data['media_score']['scored_media']

        # Recover the total mean score of all <media>
        if user.add_feeling:
            tmp.append(media_count_score)
        else:
            try:
                total_mean_score += media_data['media_score']['mean_score']
            except:
                qte_media_type -= 1

        media_dict[f"{model.__name__.replace('List', '').lower()}"] = media_data

    distrib_feels = []
    if user.add_feeling:
        distrib_feels = [sum(x) for x in zip(*tmp)]

    # Add global media info to the <media_dict>
    media_dict['total_spent_hour'] = total_time
    media_dict['total_media'] = total_media
    media_dict['total_media_and_eps'] = total_media_and_eps
    media_dict['total_score'] = total_score
    media_dict['distrib_feels'] = distrib_feels
    try:
        media_dict['total_mean_score'] = round(total_mean_score/qte_media_type, 2)
    except:
        media_dict['total_mean_score'] = '-'

    return media_dict
