import unittest
from datetime import datetime
from typing import Type, Dict
from flask_bcrypt import generate_password_hash
from backend.api import create_app, db
from backend.api.utils.enums import RoleType
from backend.config import Config


class TestConfig(Config):
	TESTING = True
	CACHE_TYPE = "SimpleCache"
	SQLALCHEMY_DATABASE_URI = "sqlite://"
	OAUTH2_PROVIDERS = {
		"foo": {
			"client_id": "foo-id",
			"client_secret": "foo-secret",
			"authorize_url": "https://foo.com/login",
			"access_token_url": "https://foo.com/token",
			"get_user": {
				"url": "https://foo.com/current",
				"email": lambda json: json["email"],
			},
			"scopes": ["user", "email"],
		},
	}


class BaseTest(unittest.TestCase):
	config: Type[Config] = TestConfig

	def connexion(self, username: str = "test", password: str = "toto") -> Dict:
		rv = self.client.post("/api/tokens", auth=(username, password))
		self.access_token = rv.json["access_token"]

		return {"Authorization": f"Bearer {self.access_token}"}

	def register_new_user(self, username: str):
		self.app.config["USER_ACTIVE_PER_DEFAULT"] = True
		rv = self.client.post("/api/register_user", json={
			"username": username,
			"email": f"{username}@example.com",
			"password": "pipou",
			"callback": "http://localhost:3000/register_token",
		})
		assert rv.status_code == 204

	def setUp(self):
		self.app = create_app(self.config)
		self.app_context = self.app.app_context()
		self.app_context.push()

		# Create all tables
		db.create_all()

		from backend.api.models.user_models import User
		from backend.api.models.utils_models import Ranks

		user = User(
			username="test",
			email="test@example.com",
			registered_on=datetime.utcnow(),
			password=generate_password_hash("toto"),
			active=True,
			role=RoleType.USER,
			activated_on=datetime.utcnow(),
		)

		db.session.add(user)
		db.session.commit()

		Ranks.update_db_ranks()

		self.client = self.app.test_client()

	def tearDown(self):
		db.session.close()
		db.drop_all()
		self.app_context.pop()
