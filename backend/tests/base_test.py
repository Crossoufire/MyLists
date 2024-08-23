import unittest
from datetime import datetime
from typing import Dict
from flask_bcrypt import generate_password_hash
from backend.api import create_app, db
from backend.api.utils.enums import RoleType
from backend.config import TestConfig


TEST_USER = {
    "username": "test",
    "password": "good-password",
}


class BaseTest(unittest.TestCase):
    def connexion(self, username: str = TEST_USER["username"], password: str = TEST_USER["password"]) -> Dict:
        rv = self.client.post("/api/tokens", auth=(username, password))
        self.access_token = rv.json["access_token"]

        return {"Authorization": f"Bearer {self.access_token}"}

    def register_new_user(self, username: str):
        self.app.config["USER_ACTIVE_PER_DEFAULT"] = True
        rv = self.client.post("/api/register_user", json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "good-password",
            "callback": "http://localhost:3000/register_token",
        })
        self.assertEqual(rv.status_code, 204)

    def setUp(self):
        self.app = create_app(config_class=TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()

        db.create_all()

        from backend.api.models.user import User
        from backend.api.models.mixins import Ranks

        self.user = User(
            username=TEST_USER["username"],
            email=f"{TEST_USER['username']}@example.com",
            registered_on=datetime.utcnow(),
            password=generate_password_hash(TEST_USER["password"]),
            activated_on=datetime.utcnow(),
            role=RoleType.USER,
            active=True,
        )

        db.session.add(self.user)
        db.session.commit()

        Ranks.update_db_ranks()

        self.client = self.app.test_client()

    def tearDown(self):
        db.session.close()
        db.drop_all()
        self.app_context.pop()
