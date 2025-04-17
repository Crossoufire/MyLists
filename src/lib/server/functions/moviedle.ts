import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getDailyMediadle = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        // today = naive_utcnow().date()
        // daily_mediadle = DailyMediadle.query.filter_by(date=today).first()
        // if not daily_mediadle:
        //     daily_mediadle = DailyMediadle.create_mediadle(today=today)
        //
        // user_progress = UserMediadleProgress.query.filter_by(user_id=current_user.id, daily_mediadle_id=daily_mediadle.id).first()
        // if not user_progress:
        //     user_progress = UserMediadleProgress.create_progress(user_id=current_user.id, daily_mediadle_id=daily_mediadle.id)
        //
        // selected_movie = Movies.query.get(daily_mediadle.media_id)
        // pixelation_level = min(daily_mediadle.pixelation_levels, user_progress.attempts + 1)
        //
        // mediadle_stats = MediadleStats.query.filter_by(user_id=current_user.id).first()
        // stats = mediadle_stats.to_dict() if mediadle_stats else None
        // if stats:
        // attempts_data = (
        //     db.session.query(UserMediadleProgress.completion_time, UserMediadleProgress.attempts)
        //         .filter(UserMediadleProgress.user_id == current_user.id, UserMediadleProgress.completion_time.is_not(None))
        //         .order_by(UserMediadleProgress.completion_time)
        //         .all()
        // )
        // stats["attempts_list"] = [{"date": row[0].strftime("%d-%b-%Y"), "attempts": row[1]} for row in attempts_data]
        //
        // data = dict(
        //     mediadle_id=daily_mediadle.id,
        //     media_id=daily_mediadle.media_id,
        //     attempts=user_progress.attempts,
        //     completed=user_progress.completed,
        //     succeeded=user_progress.succeeded,
        //     max_attempts=daily_mediadle.pixelation_levels,
        //     pixelated_cover=pixelate_image(selected_movie.media_cover, pixelation_level),
        //     non_pixelated_cover=selected_movie.media_cover if user_progress.completed else None,
        //     stats=stats,
        // )
        //
        // return jsonify(data=data), 200
    });
