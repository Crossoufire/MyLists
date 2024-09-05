import os
from unittest import mock
from flask import current_app
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.models import UserMediaUpdate
from backend.api.utils.enums import NotificationType
from backend.tests.base_test import BaseTest, TEST_USER


class UserTests(BaseTest):
    def setUp(self):
        super().setUp()
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        self.bad_image_path = os.path.join(self.current_dir, "images/anonymous_scrambled.jpg")

    def test_register_user(self):
        current_app.config["USER_ACTIVE_PER_DEFAULT"] = False

        with mock.patch("backend.api.routes.users.send_email") as send_email:
            rv = self.client.post("/api/register_user", json={
                "username": "user",
                "email": "user@example.com",
                "password": "pipou",
                "callback": "http://localhost:3000/register_token",
            })
            self.assertEqual(rv.status_code, 204)

            send_email.assert_called_once()
            self.assertEqual(send_email.call_args[1]["to"], "user@example.com")
            self.assertEqual(send_email.call_args[1]["username"], "user")
            self.assertEqual(send_email.call_args[1]["subject"], "Register account")
            self.assertEqual(send_email.call_args[1]["template"], "register")
            self.assertEqual(send_email.call_args[1]["callback"], "http://localhost:3000/register_token")

            token = send_email.call_args[1]["token"]

            # Username should be unique
            rv = self.client.post("/api/register_user", json={
                "username": "user",
                "email": "user2@example.com",
                "password": "pipou",
                "callback": "http://localhost:3000/register_token",
            })
            self.assertEqual(rv.status_code, 401)

            # Email should be unique
            rv = self.client.post("/api/register_user", json={
                "username": "user2",
                "email": "user@example.com",
                "password": "pipou",
                "callback": "http://localhost:3000/register_token",
            })
            self.assertEqual(rv.status_code, 401)

            rv = self.client.post("/api/tokens/register_token", json={"token": token})
            self.assertEqual(rv.status_code, 204)

            rv = self.client.post("/api/tokens/register_token", json={"token": token + "x"})
            self.assertEqual(rv.status_code, 400)

    def test_create_invalid_user(self):
        rv = self.client.post("/api/register_user", json={
            "username": "aaaaaaaaaaaaaaaaa",
            "email": "oui@example.com",
            "password": "pipou",
            "callback": "http://localhost:3000/register_token",
        })
        self.assertEqual(rv.status_code, 401)

        rv = self.client.post("/api/register_user", json={
            "username": "",
            "email": "toto@example.com",
            "password": "pipou",
            "callback": "http://localhost:3000/register_token",
        })
        self.assertEqual(rv.status_code, 401)

    def test_get_current_user(self):
        rv = self.client.get("/api/current_user", headers=self.connexion())
        self.assertEqual(rv.json["username"], "test")
        self.assertNotIn("password", rv.json)
        self.assertNotIn("email", rv.json)

    def test_get_profile(self):
        # TODO: Better test lol

        rv = self.client.get(f"/api/profile/test", headers=self.connexion())
        self.assertEqual(rv.status_code, 200)

        data = rv.json["data"]
        self.assertIn("user_data", data)
        self.assertIn("user_updates", data)
        self.assertIn("follows", data)
        self.assertIn("follows_updates", data)
        self.assertIn("is_following", data)
        self.assertIn("list_levels", data)
        self.assertIn("media_global", data)
        self.assertIn("media_data", data)

    def test_follows_followers_notifications(self):
        headers = self.connexion()
        self.register_new_user(username="bobby")

        # Check <test> follows
        rv = self.client.get(f"/api/profile/test/follows", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 0)
        self.assertEqual("user_data" in rv.json["data"], True)

        # Check <test> followers
        rv = self.client.get(f"/api/profile/test/followers", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 0)
        self.assertEqual("user_data" in rv.json["data"], True)

        # <test> can't follow himself
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 1,
            "follow_status": True,
        })
        self.assertEqual(rv.status_code, 400)

        # <test> try follows user does not exist (failure)
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 3,
            "follow_status": True,
        })
        self.assertEqual(rv.status_code, 400)

        # <test> follows <bobby> (success)
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 2,
            "follow_status": True,
        })
        self.assertEqual(rv.status_code, 204)

        # Check <test> has 1 follow
        rv = self.client.get(f"/api/profile/test/follows", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 1)

        # Check <test> has 0 follower
        rv = self.client.get(f"/api/profile/test/followers", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 0)

        # Check <bobby> has 1 follower
        rv = self.client.get(f"/api/profile/bobby/followers", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 1)
        self.assertEqual("user_data" in rv.json["data"], True)

        # Check <bobby> has 0 follower
        rv = self.client.get(f"/api/profile/bobby/follows", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 0)
        self.assertEqual("user_data" in rv.json["data"], True)

        # Connect as <bobby>
        headers = self.connexion("bobby", "good-password")

        # Check <bobby> has 1 notification
        rv = self.client.get(f"/api/notifications/count", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["data"], 1)

        # Check <bobby> notification from <test>
        rv = self.client.get(f"/api/notifications", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["data"][0]["user_id"], 2)
        self.assertEqual(rv.json["data"][0]["media_id"], None)
        self.assertEqual(rv.json["data"][0]["media_type"], None)
        self.assertEqual(rv.json["data"][0]["notification_type"], NotificationType.FOLLOW)
        self.assertEqual(rv.json["data"][0]["payload"], {"username": "test", "message": "test is following you"})
        self.assertEqual("timestamp" in rv.json["data"][0], True)

        # Reconnect as <test>
        headers = self.connexion()

        # <test> Unfollow <bobby>
        rv = self.client.post(f"/api/update_follow", headers=headers, json={
            "follow_id": 2,
            "follow_status": False,
        })
        self.assertEqual(rv.status_code, 204)

        # Check no follows for <test>
        rv = self.client.get(f"/api/profile/test/follows", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 0)

        # Check no followers for <bobby>
        rv = self.client.get(f"/api/profile/bobby/followers", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["follows"]), 0)
        self.assertEqual("user_data" in rv.json["data"], True)

    def test_history(self):
        rv = self.client.get(f"/api/profile/test/history", headers=self.connexion())

        self.assertEqual(rv.status_code, 200)
        self.assertIn("items", rv.json["data"])
        self.assertIn("page", rv.json["data"])
        self.assertIn("pages", rv.json["data"])
        self.assertIn("total", rv.json["data"])

        rv = self.client.get(f"/api/profile/janine/history", headers=self.connexion())
        self.assertEqual(rv.status_code, 404)

        rv = self.client.get(f"/api/profile/test/history?search=toto&page=1", headers=self.connexion())
        self.assertEqual(rv.status_code, 200)

        rv = self.client.get(f"/api/profile/test/history?search=toto&page=lol", headers=self.connexion())
        self.assertEqual(rv.status_code, 400)

    def test_settings_delete_account(self):
        from backend.api.models.user import User, Notifications, Token
        from backend.api.utils.enums import ModelTypes

        self.register_new_user(username="delete")
        headers = self.connexion("delete", "good-password")

        rv = self.client.get("/api/current_user", headers=headers)
        user_id = rv.json["id"]

        self.assertEqual(Token.query.filter_by(user_id=user_id).count(), 1)
        self.assertEqual(User.query.filter_by(id=user_id).count(), 1)
        self.assertEqual(UserMediaUpdate.query.filter_by(user_id=user_id).count(), 0)
        self.assertEqual(Notifications.query.filter_by(user_id=user_id).count(), 0)

        models = ModelsManager.get_dict_models("all", [ModelTypes.LIST, ModelTypes.LABELS])

        for model_type in models.values():
            for model in model_type.values():
                self.assertEqual(model.query.filter_by(user_id=user_id).count(), 0)

        rv = self.client.post("/api/settings/delete_account", headers=headers)
        self.assertEqual(rv.status_code, 204)

        self.assertEqual(Token.query.filter_by(user_id=user_id).count(), 0)
        self.assertEqual(User.query.filter_by(id=user_id).count(), 0)
        self.assertEqual(UserMediaUpdate.query.filter_by(user_id=user_id).count(), 0)
        self.assertEqual(Notifications.query.filter_by(user_id=user_id).count(), 0)

        for model_type in models.values():
            for model in model_type.values():
                self.assertEqual(model.query.filter_by(user_id=user_id).count(), 0)

    def test_settings_general(self):
        rv = self.client.post("/api/settings/general")
        self.assertEqual(rv.status_code, 401)

        self.register_new_user(username="bobby")
        headers = self.connexion()

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "test"})
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["updated_user"]["username"], "test")

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "robert"})
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["updated_user"]["username"], "robert")

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "too-long-username"})
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "t"})
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/settings/general", headers=headers, data={"username": "bobby"})
        self.assertEqual(rv.status_code, 400)

        with open(self.bad_image_path, "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"profile_image": fp})
            self.assertEqual(rv.status_code, 400)

        with open(self.bad_image_path, "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"background_image": fp})
            self.assertEqual(rv.status_code, 400)

        with open(os.path.join(current_app.root_path, "static/covers/default.jpg"), "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"profile_image": fp})
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(rv.json["updated_user"]["profile_image"].startswith("/api/static/profile_pics/"), True)

        with open(os.path.join(current_app.root_path, "static/covers/default.jpg"), "rb") as fp:
            rv = self.client.post("/api/settings/general", headers=headers, data={"background_image": fp})
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(rv.json["updated_user"]["back_image"].startswith("/api/static/background_pics/"), True)

    def test_settings_medialist(self):
        rv = self.client.post("/api/settings/medialist")
        self.assertEqual(rv.status_code, 401)

        rv = self.client.post("/api/settings/medialist", headers=self.connexion(), json={
            "add_feeling": True,
            "add_anime": True,
            "add_games": True,
            "add_books": True,
        })
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["updated_user"]["add_feeling"], True)
        self.assertEqual(rv.json["updated_user"]["settings"]["anime"]["active"], True)
        self.assertEqual(rv.json["updated_user"]["settings"]["games"]["active"], True)
        self.assertEqual(rv.json["updated_user"]["settings"]["books"]["active"], True)

        rv = self.client.post("/api/settings/medialist", headers=self.connexion(), json={
            "add_feeling": False,
            "add_anime": False,
            "add_games": False,
            "add_books": False,
        })
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["updated_user"]["add_feeling"], False)
        self.assertEqual(rv.json["updated_user"]["settings"]["anime"]["active"], False)
        self.assertEqual(rv.json["updated_user"]["settings"]["games"]["active"], False)
        self.assertEqual(rv.json["updated_user"]["settings"]["books"]["active"], False)

    def test_settings_password(self):
        rv = self.client.post("/api/settings/password")
        self.assertEqual(rv.status_code, 401)

        headers = self.connexion()

        rv = self.client.post("/api/settings/password", headers=headers, json={"new_password": "titi"})
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/settings/password", headers=headers, json={
            "new_password": "titi",
            "current_password": TEST_USER["password"],
        })
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/settings/password", headers=headers, json={
            "new_password": "titititi",
            "current_password": TEST_USER["password"],
        })
        self.assertEqual(rv.status_code, 200)

        headers = self.connexion("test", "titititi")
        rv = self.client.get("/api/current_user", headers=headers)
        self.assertEqual(rv.status_code, 200)
