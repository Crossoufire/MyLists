from __future__ import absolute_import
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView


class CommonModelView(ModelView):
    column_display_pk = True
    can_view_details = True


class UserModelView(CommonModelView, ModelView):
    form_columns = ["username", "email", "privacy", "role", "rating_system", "active", "registered_on",
                    "activated_on", "last_notif_read_time", "last_seen", "show_update_modal", "profile_views"]
    column_exclude_list = ["password_hash"]
    column_filters = ["username", "email", "privacy", "role", "rating_system", "active", "show_update_modal"]
    column_searchable_list = ["username", "email"]


class UserMediaUpdateModelView(CommonModelView, ModelView):
    column_filters = ["update_data", "update_type"]
    column_searchable_list = ["update_data", "update_type"]


class SeriesModelView(CommonModelView, ModelView):
    form_columns = ["name", "image_cover", "release_date", "synopsis", "lock_status", "api_id", "last_api_update",
                    "original_name", "homepage", "duration", "vote_average", "vote_count", "total_episodes",
                    "total_seasons", "last_air_date", "next_episode_to_air", "season_to_air", "episode_to_air",
                    "language", "prod_status"]
    column_searchable_list = ["name"]
    column_exclude_list = ["synopsis"]


def init_crud_admin(admin: Admin):
    from backend.api.models import Token, User, UserMediaSettings, UserMediaUpdate, Series
    from backend.api import db

    admin.add_view(CommonModelView(Token, db.session))
    admin.add_view(UserModelView(User, db.session, name="Users", endpoint="Users"))
    admin.add_view(CommonModelView(UserMediaSettings, db.session))
    admin.add_view(UserMediaUpdateModelView(UserMediaUpdate, db.session))
    admin.add_view(SeriesModelView(Series, db.session))

    return admin
