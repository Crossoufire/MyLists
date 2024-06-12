import os
from unittest import mock
from backend.api.utils.functions import ModelsFetcher
from backend.tests.base_test import BaseTest


class UserTests(BaseTest):
    access_token: str = None

    def test_register_user(self):
        with mock.patch("backend.api.routes.users.send_email") as send_email:
            rv = self.client.post("/api/register_user", json={
                "username": "user",
                "email": "user@example.com",
                "password": "pipou",
                "callback": "http://localhost:3000/register_token",
            })
            assert rv.status_code == 204

            send_email.assert_called_once()
            assert send_email.call_args[1]["to"] == "user@example.com"
            assert send_email.call_args[1]["username"] == "user"
            assert send_email.call_args[1]["subject"] == "Register account"
            assert send_email.call_args[1]["template"] == "register"
            assert send_email.call_args[1]["callback"] == "http://localhost:3000/register_token"

            token = send_email.call_args[1]["token"]

            rv = self.client.post("/api/register_user", json={
                "username": "user",
                "email": "user2@example.com",
                "password": "pipou",
                "callback": "http://localhost:3000/register_token",
            })
            assert rv.status_code == 401

            rv = self.client.post("/api/register_user", json={
                "username": "user2",
                "email": "user@example.com",
                "password": "pipou",
                "callback": "http://localhost:3000/register_token",
            })
            assert rv.status_code == 401

            rv = self.client.post("/api/tokens/register_token", json={"token": token})
            assert rv.status_code == 204

            rv = self.client.post("/api/tokens/register_token", json={"token": token + "x"})
            assert rv.status_code == 400

    def test_create_invalid_user(self):
        rv = self.client.post("/api/register_user", json={
            "username": "aaaaaaaaaaaaaaaaa",
            "email": "oui@example.com",
            "password": "pipou",
            "callback": "http://localhost:3000/register_token",
        })
        assert rv.status_code == 401

        rv = self.client.post("/api/register_user", json={
            "username": "",
            "email": "toto@example.com",
            "password": "pipou",
            "callback": "http://localhost:3000/register_token",
        })
        assert rv.status_code == 401

    def test_get_current_user(self):
        headers = self.connexion()

        rv = self.client.get("/api/current_user", headers=headers)
        assert rv.json["username"] == "test"
        assert "password" not in rv.json and "email" not in rv.json

    def test_get_profile(self):
        headers = self.connexion()
        rv = self.client.get(f"/api/profile/test", headers=headers)
        assert rv.status_code == 200

        data = rv.json["data"]
        assert "user_data" in data
        assert "user_updates" in data
        assert "follows" in data
        assert "follows_updates" in data
        assert "is_following" in data
        assert "list_levels" in data
        assert "media_global" in data
        assert "media_data" in data

    def test_follows_followers_notifications(self):
        """ Test the adding/deleting of a follows, check followers and check notification send to followed user """

        headers = self.connexion()
        self.register_new_user(username="bobby")

        # Check <test> follows
        rv = self.client.get(f"/api/profile/test/follows", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 0
        assert "user_data" in rv.json["data"]

        # Check <test> followers
        rv = self.client.get(f"/api/profile/test/followers", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 0
        assert "user_data" in rv.json["data"]

        # <test> can't follow himself
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 1,
            "follow_status": True,
        })
        assert rv.status_code == 400

        # <test> try follows user does not exist (failure)
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 3,
            "follow_status": True,
        })
        assert rv.status_code == 400

        # <test> follows <bobby> (success)
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 2,
            "follow_status": True,
        })
        assert rv.status_code == 204

        # Check <test> has 1 follow
        rv = self.client.get(f"/api/profile/test/follows", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 1

        # Check <test> has 0 follower
        rv = self.client.get(f"/api/profile/test/followers", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 0

        # Check <bobby> has 1 follower
        rv = self.client.get(f"/api/profile/bobby/followers", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 1
        assert "user_data" in rv.json["data"]

        # Check <bobby> has 0 follower
        rv = self.client.get(f"/api/profile/bobby/follows", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 0
        assert "user_data" in rv.json["data"]

        # Connect as <bobby>
        headers = self.connexion("bobby", "pipou")

        # Check <bobby> has 1 notification
        rv = self.client.get(f"/api/notifications/count", headers=headers)
        assert rv.status_code == 200
        assert rv.json["data"] == 1

        # Check <bobby> notification from <test>
        rv = self.client.get(f"/api/notifications", headers=headers)
        assert rv.status_code == 200
        assert rv.json["data"][0]["media"] is None
        assert rv.json["data"][0]["media_id"] is None
        assert rv.json["data"][0]["payload"] == {"message": "test is following you", "username": "test"}
        assert "timestamp" in rv.json["data"][0]

        # Reconnect as <test>
        headers = self.connexion()

        # <test> Unfollow <bobby>
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 2,
            "follow_status": False,
        })
        assert rv.status_code == 204

        # Check no follows for <test>
        rv = self.client.get(f"/api/profile/test/follows", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 0

        # Check no followers for <bobby>
        rv = self.client.get(f"/api/profile/bobby/followers", headers=headers)
        assert rv.status_code == 200
        assert len(rv.json["data"]["follows"]) == 0
        assert "user_data" in rv.json["data"]

    def test_history(self):
        headers = self.connexion()

        rv = self.client.get(f"/api/profile/test/history", headers=headers)
        assert rv.status_code == 200
        assert "history" in rv.json["data"]
        assert "active_page" in rv.json["data"]
        assert "pages" in rv.json["data"]
        assert "total" in rv.json["data"]

        rv = self.client.get(f"/api/profile/janine/history", headers=headers)
        assert rv.status_code == 404

        rv = self.client.get(f"/api/profile/test/history?search=toto&page=1", headers=headers)
        assert rv.status_code == 200

        # Put page as 1
        rv = self.client.get(f"/api/profile/test/history?search=toto&page=lol", headers=headers)
        assert rv.status_code == 200

    def test_settings_delete_account(self):
        from backend.api.models.user_models import User, UserLastUpdate, Notifications, Token
        from backend.api.utils.enums import ModelTypes

        self.register_new_user(username="delete")
        headers = self.connexion("delete", "pipou")

        rv = self.client.get("/api/current_user", headers=headers)
        user_id = rv.json["id"]

        assert Token.query.filter_by(user_id=user_id).count() == 1
        assert User.query.filter_by(id=user_id).count() == 1
        assert UserLastUpdate.query.filter_by(user_id=user_id).count() == 0
        assert Notifications.query.filter_by(user_id=user_id).count() == 0

        models = ModelsFetcher.get_dict_models("all", [ModelTypes.LIST, ModelTypes.LABELS])

        for model_type in models.values():
            for model in model_type.values():
                assert model.query.filter_by(user_id=user_id).count() == 0

        rv = self.client.post("/api/settings/delete_account", headers=headers)
        assert rv.status_code == 204

        assert Token.query.filter_by(user_id=user_id).count() == 0
        assert User.query.filter_by(id=user_id).count() == 0
        assert UserLastUpdate.query.filter_by(user_id=user_id).count() == 0
        assert Notifications.query.filter_by(user_id=user_id).count() == 0

        for model_type in models.values():
            for model in model_type.values():
                assert model.query.filter_by(user_id=user_id).count() == 0

    def test_settings_general(self):
        rv = self.client.post("/api/settings/general")
        assert rv.status_code == 401

        self.register_new_user(username="bobby")

        headers = self.connexion()

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "test"})
        assert rv.status_code == 200
        assert rv.json["updated_user"]["username"] == "test"

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "robert"})
        assert rv.status_code == 200
        assert rv.json["updated_user"]["username"] == "robert"

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "too-long-username"})
        assert rv.status_code == 400

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "t"})
        assert rv.status_code == 400

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "bobby"})
        assert rv.status_code == 400

        with open("backend/tests/images/anonymous_scrambled.jpg", "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"profile_image": fp})
            assert rv.status_code == 400

        with open("backend/tests/images/anonymous_scrambled.jpg", "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"background_image": fp})
            assert rv.status_code == 400

        with open(os.path.join(os.path.abspath("."), f"backend/api/static/covers/default.jpg"), "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"profile_image": fp})
            assert rv.status_code == 200
            assert rv.json["updated_user"]["profile_image"].startswith("/api/static/profile_pics/")

        with open(os.path.join(os.path.abspath("."), f"backend/api/static/covers/default.jpg"), "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"background_image": fp})
            assert rv.status_code == 200
            assert rv.json["updated_user"]["back_image"].startswith("/api/static/background_pics/")

    def test_settings_medialist(self):
        rv = self.client.post("/api/settings/medialist")
        assert rv.status_code == 401

        headers = self.connexion()

        rv = self.client.post("/api/settings/medialist", headers=headers, json={
            "add_feeling": True,
            "add_anime": True,
            "add_games": True,
            "add_books": True,
        })
        assert rv.status_code == 200
        assert rv.json["updated_user"]["add_feeling"] == True
        assert rv.json["updated_user"]["add_anime"] == True
        assert rv.json["updated_user"]["add_games"] == True
        assert rv.json["updated_user"]["add_books"] == True

        rv = self.client.post("/api/settings/medialist", headers=headers, json={
            "add_feeling": False,
            "add_anime": False,
            "add_games": False,
            "add_books": False,
        })
        assert rv.status_code == 200
        assert rv.json["updated_user"]["add_feeling"] == False
        assert rv.json["updated_user"]["add_anime"] == False
        assert rv.json["updated_user"]["add_games"] == False
        assert rv.json["updated_user"]["add_books"] == False

    def test_settings_password(self):
        rv = self.client.post("/api/settings/password")
        assert rv.status_code == 401

        headers = self.connexion()

        rv = self.client.post("/api/settings/password", headers=headers, json={"new_password": "titi"})
        assert rv.status_code == 400

        rv = self.client.post("/api/settings/password", headers=headers, json={
            "new_password": "titi",
            "current_password": "toto",
        })
        assert rv.status_code == 400

        rv = self.client.post("/api/settings/password", headers=headers, json={
            "new_password": "titititi",
            "current_password": "toto",
        })
        assert rv.status_code == 200

        headers = self.connexion("test", "titititi")
        rv = self.client.get("/api/current_user", headers=headers)
        assert rv.status_code == 200
