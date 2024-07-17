from datetime import datetime
from flask import url_for
from backend.api import db
from backend.api.models.user_models import User, Token
from backend.api.utils.enums import RoleType, MediaType
from backend.api.utils.functions import get_level
from backend.tests.base_test import BaseTest


class UserModelTests(BaseTest):
    def test_profile_image(self):
        self.assertEqual(self.user.profile_image, "http://localhost:5000/api/static/profile_pics/default.jpg")

    def test_back_image(self):
        self.assertEqual(self.user.back_image, "http://localhost:5000/api/static/background_pics/default.jpg")

    def test_profile_border(self):
        self.assertIn("border_", self.user.profile_border)

    def test_followers_count(self):
        self.assertEqual(self.user.followers_count, 0)

    def test_profile_level(self):
        total_time_spent = (
            self.user.time_spent_series +
            self.user.time_spent_movies +
            self.user.time_spent_anime +
            self.user.time_spent_books +
            self.user.time_spent_games
        )
        expected_level = get_level(total_time_spent)
        self.assertEqual(self.user.profile_level, expected_level)

    def test_to_dict(self):
        user_dict = self.user.to_dict()
        self.assertNotIn("email", user_dict)
        self.assertNotIn("password", user_dict)
        self.assertEqual(user_dict["username"], "test")
        self.assertEqual(user_dict["followers_count"], 0)
        self.assertEqual(user_dict["role"], RoleType.USER.value)

    def test_activated_media_type(self):
        self.user.add_anime = True
        self.user.add_games = True
        self.user.add_books = False
        db.session.commit()
        activated_types = self.user.activated_media_type()
        self.assertIn(MediaType.ANIME, activated_types)
        self.assertIn(MediaType.GAMES, activated_types)
        self.assertNotIn(MediaType.BOOKS, activated_types)

    def test_verify_password(self):
        self.assertTrue(self.user.verify_password("good-password"))
        self.assertFalse(self.user.verify_password("wrong-password"))

    def test_ping(self):
        old_last_seen = self.user.last_seen
        self.user.ping()
        db.session.commit()
        self.assertNotEqual(self.user.last_seen, old_last_seen)
        self.assertAlmostEqual(self.user.last_seen, datetime.utcnow(), delta=1)

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
        self.assertEqual(token.user_id, self.user.id)

    def test_generate_admin_token(self):
        token = self.user.generate_admin_token()
        self.assertIsInstance(token, Token)
        self.assertEqual(token.user_id, self.user.id)
        self.assertTrue(token.is_admin())

    # def test_check_authorization(self):
    #     other_user = User(
    #         username='otheruser',
    #         email='other@example.com',
    #         registered_on=datetime.utcnow(),
    #         password=generate_password_hash('password')
    #     )
    #     db.session.add(other_user)
    #     db.session.commit()
    #
    #     self.assertEqual(self.user.check_autorization('otheruser'), other_user)
    #     with self.assertRaises(HTTPException) as context:
    #         self.user.check_autorization('nonexistentuser')
    #     self.assertEqual(context.exception.code, 404)
    #
    #     admin_user = User(
    #         username='admin',
    #         email='admin@example.com',
    #         registered_on=datetime.utcnow(),
    #         password=generate_password_hash('password'),
    #         role=RoleType.ADMIN
    #     )
    #     db.session.add(admin_user)
    #     db.session.commit()
    #
    #     with self.assertRaises(HTTPException) as context:
    #         self.user.check_autorization('admin')
    #     self.assertEqual(context.exception.code, 403)

    # def test_set_view_count(self):
    #     other_user = User(
    #         username='otheruser',
    #         email='other@example.com',
    #         registered_on=datetime.utcnow(),
    #         password=generate_password_hash('password')
    #     )
    #     db.session.add(other_user)
    #     db.session.commit()
    #
    #     initial_views = other_user.series_views
    #     self.user.set_view_count(other_user, MediaType.SERIES)
    #     self.assertEqual(other_user.series_views, initial_views + 1)
    #
    #     admin_user = User(
    #         username='admin',
    #         email='admin@example.com',
    #         registered_on=datetime.utcnow(),
    #         password=generate_password_hash('password'),
    #         role=RoleType.ADMIN
    #     )
    #     db.session.add(admin_user)
    #     db.session.commit()
    #
    #     admin_user.set_view_count(other_user, MediaType.SERIES)
    #     self.assertEqual(other_user.series_views, initial_views + 1)  # No increment since admin
    #
    # def test_add_follow(self):
    #     other_user = User(
    #         username='otheruser',
    #         email='other@example.com',
    #         registered_on=datetime.utcnow(),
    #         password=generate_password_hash('password')
    #     )
    #     db.session.add(other_user)
    #     db.session.commit()
    #
    #     self.user.add_follow(other_user)
    #     self.assertTrue(self.user.is_following(other_user))
    #
    #     # Ensure that adding the same follow again doesn't create duplicates
    #     initial_follow_count = self.user.followed.count()
    #     self.user.add_follow(other_user)
    #     self.assertEqual(self.user.followed.count(), initial_follow_count)

    # def test_follow(self):
    #     u1 = User(username='john', email='john@example.com')
    #     u2 = User(username='susan', email='susan@example.com')
    #     db.session.add_all([u1, u2])
    #     db.session.commit()
    #     assert db.session.scalars(u1.following.select()).all() == []
    #     assert db.session.scalars(u1.followers.select()).all() == []
    #
    #     for _ in range(2):
    #         u1.follow(u2)
    #         db.session.commit()
    #         assert u1.is_following(u2)
    #         assert not u1.is_following(u1)
    #         assert not u2.is_following(u1)
    #         assert db.session.scalar(sa.select(sa.func.count()).select_from(
    #             u1.following.select().subquery())) == 1
    #         assert db.session.scalar(u1.following.select()).username == 'susan'
    #         assert db.session.scalar(sa.select(sa.func.count()).select_from(
    #             u2.followers.select().subquery())) == 1
    #         assert db.session.scalar(u2.followers.select()).username == 'john'
    #
    #     for _ in range(2):
    #         u1.unfollow(u2)
    #         db.session.commit()
    #         assert not u1.is_following(u2)
    #         assert db.session.scalar(sa.select(sa.func.count()).select_from(
    #             u1.following.select().subquery())) == 0
    #         assert db.session.scalar(sa.select(sa.func.count()).select_from(
    #             u2.followers.select().subquery())) == 0
