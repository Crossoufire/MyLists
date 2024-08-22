from flask import Blueprint, abort, g
from backend.api import db
from backend.api.core.handlers import token_auth, current_user
from backend.api.managers.ListQueryManager import ListQueryManager, ListFiltersManager
from backend.api.managers.StatsManager import BaseStats
from backend.api.models import UserMediaUpdate
from backend.api.schemas.core import EmptySchema
from backend.api.schemas.lists import *
from backend.api.utils.decorators import check_privacy_access
from backend.api.utils.enums import MediaType, Status, UpdateType, ModelTypes
from backend.api.managers.ModelsManager import ModelsManager
from backend.my_apifairy import authenticate, arguments, response, body, other_responses

lists = Blueprint("lists", __name__)


@lists.route("/list/<media_type>/<username>", methods=["GET"])
@authenticate(token_auth)
@check_privacy_access
@arguments(ListQuerySchema)
@response(UserListOneOfSchema, 200, description=f"Return The Media List of a User")
def get_media_list(args, media_type: MediaType):
    """ User Media list """

    user = g.requested_user
    if user.get_media_setting(media_type).active is False:
        return abort(404, "List not found")

    media_data, pagination = ListQueryManager(user, media_type, args).return_results()

    return dict(user_data=user, media_data=media_data, pagination=pagination)


@lists.route("/list/upcoming", methods=["GET"])
@authenticate(token_auth)
@response(UpcomingReleasesSchema(many=True), 200, description="All user's upcoming media to be released")
def get_upcoming_releases():
    """ Upcoming releases """

    activated_media_types = [setting.media_type for setting in current_user.settings if setting.active]
    models_list = ModelsManager.get_lists_models(activated_media_types, ModelTypes.LIST)
    if BooksList in models_list:
        models_list.remove(BooksList)

    return [dict(media_type=model.GROUP, items=model.get_upcoming_media()) for model in models_list]


@lists.route("/list/<media_type>/<username>/filters", methods=["GET"])
@authenticate(token_auth)
@check_privacy_access
@response(ListFiltersSchema, 200, description="Return the filters for a user's list")
def get_media_list_filters(media_type: MediaType):
    """ User media list filters """
    return ListFiltersManager(g.requested_user, media_type).return_filters()


@lists.route("/list/stats/<media_type>/<username>", methods=["GET"])
@authenticate(token_auth)
@check_privacy_access
@response(MediaListStatsSchema, 200, description="Return the media list stats")
def get_list_stats(media_type: MediaType):
    """ User List Stats """

    user = g.requested_user
    stats_manager = BaseStats.get_subclass(media_type)
    manager = stats_manager(user)
    stats = manager.create_stats()

    return dict(stats=stats, is_current=(user.id == current_user.id))


@lists.route("/list/<media_type>/add", methods=["POST"])
@authenticate(token_auth)
@body(BodyAddToListSchema)
@response(AddToListOneOfSchema, 200, description="Media added to your list. Returns the association data.")
@other_responses({404: "Media not found", 400: "Media already present in your list"})
def add_to_list(data, media_type: MediaType):
    """ Add a media to user's list """

    media_model, list_model = ModelsManager.get_lists_models(media_type, [ModelTypes.MEDIA, ModelTypes.LIST])

    media = media_model.query.filter_by(id=data["media_id"]).first()
    if not media:
        return abort(404, "Media not found")

    check_media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if check_media_assoc:
        return abort(400, "Media already present in your list")

    new_value, media_assoc = media.add_to_user(current_user.id, data["payload"])
    media_assoc.update_time_spent(current_user, new_value=new_value)
    UserMediaUpdate.set_new_update(
        user_id=current_user.id,
        media=media,
        update_type=UpdateType.STATUS,
        old_value=None,
        new_value=data["payload"],
    )
    db.session.commit()

    return dict(media_assoc=media_assoc, history=UserMediaUpdate.get_history(current_user.id, media.id, media_type))


@lists.route("/list/<media_type>/remove", methods=["POST"])
@authenticate(token_auth)
@body(RemoveFromListSchema)
@response(EmptySchema, 204, description="Media successfully deleted from your list")
@other_responses({404: "Media not present in your list"})
def remove_from_list(data, media_type: MediaType):
    """ Remove media from list """

    list_model, label_model = ModelsManager.get_lists_models(media_type, [ModelTypes.LIST, ModelTypes.LABELS])

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    old_total = media_assoc.total if media_assoc.media_type != MediaType.GAMES else media_assoc.current_playtime
    media_assoc.update_time_spent(current_user, old_value=old_total, new_value=0)

    db.session.delete(media_assoc)
    label_model.remove_from_media_list(current_user.id, data["media_id"])
    UserMediaUpdate.delete_history(current_user.id, data["media_id"], media_type)

    db.session.commit()

    return {}


@lists.route("/list/<media_type>/favorite", methods=["POST"])
@authenticate(token_auth)
@body(UpdateFavoriteSchema)
@response(EmptySchema, 204, description="Favorite media successfully updated")
@other_responses({404: "Media not present in your list"})
def toggle_favorite(data, media_type: MediaType):
    """ Toggle favorite status of a media """

    list_model = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    media_assoc.favorite = data["payload"]
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/status", methods=["POST"])
@authenticate(token_auth)
@body(UpdateStatusSchema)
@response(EmptySchema, 204, description="Status successfully updated")
@other_responses({404: "Media not present in your list"})
def set_status(data, media_type: MediaType):
    """ Set the status of a media """

    list_model = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    old_total = media_assoc.total if media_assoc.media_type != MediaType.GAMES else media_assoc.current_playtime
    old_status = media_assoc.status

    new_total = media_assoc.update_status(data["payload"])
    UserMediaUpdate.set_new_update(
        user_id=current_user.id,
        media=media_assoc.media,
        update_type=UpdateType.STATUS,
        old_value=old_status,
        new_value=data["payload"]
    )
    media_assoc.update_time_spent(current_user, old_value=old_total, new_value=new_total)
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/rating", methods=["POST"])
@authenticate(token_auth)
@body(UpdateRatingSchema)
@response(EmptySchema, 204, description="Rating successfully updated")
@other_responses({404: "Media not present in your list"})
def set_rating(data, media_type: MediaType):
    """ Set the rating of a media """

    list_model = ModelsManager.get_unique_model(MediaType(media_type), ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    media_assoc.rating = data["payload"]
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/redo", methods=["POST"])
@authenticate(token_auth)
@body(UpdateRedoSchema)
@response(EmptySchema, 204, description="Re-read/re-watched successfully updated")
@other_responses({404: "Media not present in your list", 400: "Invalid status or media type"})
def set_redo(data, media_type: MediaType):
    """ Set the redo of a media """

    list_model = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    if media_assoc.status != Status.COMPLETED or media_assoc.media_type == MediaType.GAMES:
        return abort(400, "Invalid status or media type")

    old_redo = media_assoc.redo
    old_total = media_assoc.total

    new_total = media_assoc.update_total(data["payload"])
    UserMediaUpdate.set_new_update(
        user_id=current_user.id,
        media=media_assoc.media,
        update_type=UpdateType.REDO,
        old_value=old_redo,
        new_value=data["payload"]
    )
    media_assoc.update_time_spent(current_user, old_value=old_total, new_value=new_total)
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/comment", methods=["POST"])
@authenticate(token_auth)
@body(UpdateCommentSchema)
@response(EmptySchema, 204, description="Comment successfully updated")
@other_responses({404: "Media not present in your list"})
def set_comment(data, media_type: MediaType):
    """ Update the comment of a media """

    list_model = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if media_assoc is None:
        return abort(404, "Media not present in your list")

    media_assoc.comment = data["payload"]
    db.session.commit()

    return {}


@lists.route("/list/games/playtime", methods=["POST"])
@authenticate(token_auth)
@body(UpdatePlaytimeSchema)
@response(EmptySchema, 204, description="Playtime successfully updated")
@other_responses({404: "Media not present in your list"})
def set_playtime(data):
    """ Update playtime of a game """

    list_model = ModelsManager.get_unique_model(MediaType.GAMES, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    old_playtime = media_assoc.current_playtime

    media_assoc.update_time_spent(current_user, old_value=old_playtime, new_value=data["payload"])
    UserMediaUpdate.set_new_update(
        user_id=current_user.id,
        media=media_assoc.media,
        update_type=UpdateType.PLAYTIME,
        old_value=old_playtime,
        new_value=data["payload"]
    )
    media_assoc.current_playtime = data["payload"]
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/season", methods=["POST"])
@authenticate(token_auth)
@body(UpdateSeasonSchema)
@response(EmptySchema, 204, description="Season successfully updated")
@other_responses({404: "Media not present in your list", 400: "Invalid season"})
def set_season(data, media_type: MediaType):
    """ Update the season of a TV media """

    list_model = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    if data["payload"] > media_assoc.media.eps_seasons[-1].season:
        return abort(400, "Invalid season")

    old_episode = media_assoc.current_episode
    old_season = media_assoc.current_season
    old_total = media_assoc.total

    new_watched = sum(media_assoc.media.eps_seasons[:data["payload"] - 1]) + 1
    media_assoc.current_season = data["payload"]
    media_assoc.current_episode = 1
    new_total = new_watched + (media_assoc.redo * sum([s.episode for s in media_assoc.media.eps_seasons]))
    media_assoc.total = new_total

    media_assoc.update_time_spent(current_user, old_value=old_total, new_value=new_total)
    UserMediaUpdate.set_new_update(
        user_id=current_user.id,
        media=media_assoc.media,
        update_type=UpdateType.TV,
        old_value=(old_season, old_episode),
        new_value=(data["payload"], 1),
    )
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/episode", methods=["POST"])
@authenticate(token_auth)
@body(UpdateEpisodeSchema)
@response(EmptySchema, 204, description="Episode successfully updated")
@other_responses({404: "Media not present in your list", 400: "Invalid episode"})
def set_episode(data, media_type: MediaType):
    """ Update the episode of a TV media """

    list_model = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    if data["payload"] > media_assoc.media.eps_seasons[media_assoc.current_season - 1].episode:
        return abort(400, "Invalid episode")

    old_season = media_assoc.current_season
    old_episode = media_assoc.current_episode
    old_total = media_assoc.total
    new_watched = sum([s.episode for s in media_assoc.media.eps_seasons[:old_season - 1]]) + data["payload"]
    new_total = new_watched + (media_assoc.redo * sum([s.episode for s in media_assoc.media.eps_seasons]))

    media_assoc.current_episode = data["payload"]
    media_assoc.total = new_total

    media_assoc.update_time_spent(current_user, old_value=old_total, new_value=new_total)
    UserMediaUpdate.set_new_update(
        user_id=current_user.id,
        media=media_assoc.media,
        update_type=UpdateType.TV,
        old_value=(old_season, old_episode),
        new_value=(old_season, data["payload"]),
    )
    db.session.commit()

    return {}


@lists.route("/list/books/page", methods=["POST"])
@authenticate(token_auth)
@body(UpdatePageSchema)
@response(EmptySchema, 204, description="Page successfully updated")
@other_responses({404: "Media not present in your list", 400: "Invalid page"})
def set_page(data):
    """ Update the page of a book """

    list_model = ModelsManager.get_unique_model(MediaType.BOOKS, ModelTypes.LIST)

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not present in your list")

    if data["payload"] > int(media_assoc.media.pages):
        return abort(400, "Invalid page")

    old_page = media_assoc.current_page
    old_total = media_assoc.total

    media_assoc.current_page = data["payload"]
    new_total = data["payload"] + (media_assoc.redo * media_assoc.media.pages)
    media_assoc.total = new_total

    media_assoc.update_time_spent(current_user, old_value=old_total, new_value=new_total)
    UserMediaUpdate.set_new_update(
        user_id=current_user.id,
        media=media_assoc.media,
        update_type=UpdateType.PAGE,
        old_value=old_page,
        new_value=data["payload"]
    )
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/labels/<media_id>", methods=["GET"])
@authenticate(token_auth)
@response(MediaLabelSchema, 200, description="Return the labels associated with a media and a user")
@other_responses({404: "Media not found"})
def get_media_labels(media_type: MediaType, media_id: int):
    """ Labels associated with a media and a user """

    media_model, label_model = ModelsManager.get_lists_models(MediaType(media_type), [ModelTypes.MEDIA, ModelTypes.LABELS])

    media = media_model.query.filter_by(id=media_id).first()
    if not media:
        return abort(404, "Media not found")

    return label_model.get_user_media_labels(user_id=current_user.id, media_id=media_id)


@lists.route("/list/<media_type>/label/add", methods=["POST"])
@authenticate(token_auth)
@body(AddLabelToMediaSchema)
@response(EmptySchema, 204, description="Label successfully added")
@other_responses({404: "Media not found", 400: "Label already associated with this media"})
def add_label_to_media(data, media_type: MediaType):
    """ Add a label to a media """

    list_model, label_model = ModelsManager.get_lists_models(
        MediaType(media_type),
        [ModelTypes.LIST, ModelTypes.LABELS]
    )

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not in your list")

    label = label_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"], name=data["payload"]).first()
    if label:
        return abort(400, "Label already associated with this media")

    new_total = label_model(user_id=current_user.id, media_id=data["media_id"], name=data["payload"])
    db.session.add(new_total)
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/label/remove", methods=["POST"])
@authenticate(token_auth)
@body(AddLabelToMediaSchema)
@response(EmptySchema, 204, description="Label successfully removed")
@other_responses({404: "Media not in your list"})
def remove_label_from_media(data, media_type: MediaType):
    """ Remove label from media """

    list_model, label_model = ModelsManager.get_lists_models(media_type, [ModelTypes.LIST, ModelTypes.LABELS])

    media_assoc = list_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"]).first()
    if not media_assoc:
        return abort(404, "Media not in your list")

    label_model.query.filter_by(user_id=current_user.id, media_id=data["media_id"], name=data["payload"]).delete()
    db.session.commit()

    return {}


@lists.route("/list/<media_type>/label/rename", methods=["POST"])
@authenticate(token_auth)
@body(RenameLabelSchema)
@response(EmptySchema, 204, description="Label successfully renamed")
@other_responses({400: "Label name already exists"})
def rename_label(data, media_type: MediaType):
    """ Rename a label """

    labels_model = ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)

    label_name = (
        labels_model.query
        .filter_by(user_id=current_user.id, media_type=media_type, name=data["new_name"])
        .first()
    )
    if label_name:
        return abort(400, "Label name already exists")

    labels = labels_model.query.filter_by(user_id=current_user.id, name=data["old_name"]).all()
    for label in labels:
        label.label = data["new_name"]

    db.session.commit()

    return {}


@lists.route("/list/<media_type>/label/delete", methods=["POST"])
@authenticate(token_auth)
@body(DeleteLabelSchema)
@response(EmptySchema, 204, description="Label totally removed from all media")
@other_responses({404: "Media not found"})
def delete_label_totally(data, media_type: MediaType):
    """ Delete label and associations """

    labels_model = ModelsManager.get_unique_model(media_type, ModelTypes.LABELS)
    labels_model.query.filter_by(user_id=current_user.id, name=data["name"]).delete()
    db.session.commit()

    return {}
