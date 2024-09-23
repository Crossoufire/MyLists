from backend.api import db
from backend.api.models.user import Token, User
from backend.api.utils.enums import RoleType, MediaType
from backend.api.utils.functions import compute_level
from backend.tests.base_test import BaseTest


class UserModelTests(BaseTest):
    def test_profile_image(self):
        self.assertEqual(self.user.profile_image, "http://localhost:5000/api/static/profile_pics/default.jpg")

    def test_back_image(self):
        self.assertEqual(self.user.back_image, "http://localhost:5000/api/static/background_pics/default.jpg")

    def test_followers_count(self):
        self.assertEqual(self.user.followers_count, 0)

    def test_profile_level(self):
        total_time_spent = sum(settings.time_spent for settings in self.user.settings)
        expected_level = compute_level(total_time_spent)
        self.assertEqual(self.user.profile_level, expected_level)

    def test_get_media_setting(self):
        for media_type in MediaType:
            setting = self.user.get_media_setting(media_type)
            self.assertEqual(setting.media_type, media_type)

    def test_to_dict(self):
        user_dict = self.user.to_dict()
        self.assertNotIn("email", user_dict)
        self.assertNotIn("password", user_dict)
        self.assertEqual(user_dict["username"], "test")
        self.assertEqual(user_dict["followers_count"], 0)
        self.assertEqual(user_dict["role"], RoleType.USER.value)

    def test_verify_password(self):
        self.assertTrue(self.user.verify_password("good-password"))
        self.assertFalse(self.user.verify_password("wrong-password"))

    def test_ping(self):
        old_last_seen = self.user.last_seen
        self.user.ping()
        db.session.commit()
        self.assertNotEqual(self.user.last_seen, old_last_seen)

    def test_revoke_all_tokens(self):
        token = Token(user=self.user)
        token.generate()
        db.session.add(token)
        db.session.commit()

        self.assertEqual(Token.query.filter_by(user=self.user).count(), 1)
        self.user.revoke_all_tokens()
        self.assertEqual(Token.query.filter_by(user=self.user).count(), 0)

    def test_generate_auth_token(self):
        token = self.user.generate_auth_token()
        self.assertIsInstance(token, Token)

    def test_follow(self):
        self.register_new_user("bobby")
        bobby = User.query.filter_by(username="bobby").first()

        self.assertEqual(self.user.followers.count(), 0)
        self.assertEqual(bobby.followers.count(), 0)

        self.user.add_follow(bobby)
        db.session.commit()
        self.assertEqual(self.user.is_following(bobby), True)
        self.assertEqual(self.user.is_following(self.user), False)
        self.assertEqual(bobby.is_following(self.user), False)

        self.assertEqual(self.user.followers.count(), 0)
        self.assertEqual(bobby.followers.count(), 1)

        follows = self.user.get_follows(limit=8)
        self.assertEqual(follows["total"], 1)
        self.assertEqual(follows["follows"][0]["username"], "bobby")

        self.user.remove_follow(bobby)
        db.session.commit()
        self.assertEqual(self.user.is_following(bobby), False)
        self.assertEqual(self.user.followers.count(), 0)
        self.assertEqual(bobby.followers.count(), 0)
