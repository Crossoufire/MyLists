import os
import json
from typing import Dict
from datetime import timedelta

from backend.api import db
from backend.tests.base_test import BaseTest
from backend.api.utils.functions import naive_utcnow
from backend.api.managers.ModelsManager import ModelsManager
from backend.api.services.api.factory import ApiServiceFactory
from backend.api.utils.enums import MediaType, ModelTypes, Status, GamesPlatformsEnum


class MediaTests(BaseTest):
    TOO_LONG_COMMENT = "test" * 1000

    @staticmethod
    def create_all_media():
        media_files = ["series.json", "anime.json", "movies.json", "books.json", "games.json"]
        base_dir = os.path.abspath(os.path.dirname(__file__))

        for media_type, media_file in zip(MediaType, media_files):
            with open(f"{base_dir}/media/{media_file}") as fp:
                media_dict = json.load(fp)
                media_dict["last_api_update"] = naive_utcnow()

            # noinspection PyTypeChecker
            api_service = ApiServiceFactory.create(media_type)
            api_service.save_media_to_db_from_json({"media_data": media_dict})

    def _add_media(self, media_type: str, media_id: int, status: str, time_spent: float) -> Dict:
        self.create_all_media()

        rv = self.client.post("/api/add_media")
        self.assertEqual(rv.status_code, 401)

        headers = self.connexion()

        rv = self.client.get("/api/current_user", headers=headers)
        self.assertEqual(rv.status_code, 200)

        invalid_payloads = [
            (media_id, "toto", status),
            (media_id, media_type, "toto"),
            (2, media_type, status),
        ]
        for payload in invalid_payloads:
            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": payload[0],
                "media_type": payload[1],
                "payload": payload[2],
            })
            self.assertEqual(rv.status_code, 404 if payload[0] == 2 else 400)

        rv_good = self.client.post("/api/add_media", headers=headers, json={
            "media_id": media_id,
            "media_type": media_type,
            "payload": status,
        })
        self.assertEqual(rv_good.status_code, 200)

        # Media already in <test> media list
        rv = self.client.post("/api/add_media", headers=headers, json={
            "media_id": media_id,
            "media_type": media_type,
            "payload": status,
        })
        self.assertEqual(rv.status_code, 400)

        # Check time spent
        rv = self.client.get("/api/current_user", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(next((s["time_spent"] for s in rv.json["settings"] if s["media_type"] == media_type)), time_spent)

        return rv_good.json["data"]

    def test_add_series(self):
        data = self._add_media("series", 1, "Watching", 40)

        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["username"], "test")
        self.assertEqual(data["media_id"], 1)
        self.assertEqual(data["media_name"], "Breaking Bad")
        self.assertEqual(data["all_status"], [status.value for status in Status.by(MediaType.SERIES)])
        self.assertEqual(data["status"], "Watching")
        self.assertEqual(data["media_cover"].startswith("/api/static/covers/series_covers/"), True)
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["redo"], 0)
        self.assertEqual(data["current_season"], 1)
        self.assertEqual(data["eps_per_season"], [7, 13, 13, 13, 16])
        self.assertEqual(data["last_episode_watched"], 1)
        self.assertEqual(data["rating"], {"type": "score", "value": None})
        self.assertEqual(data["favorite"], None)
        self.assertEqual(data["comment"], None)
        self.assertEqual(data["labels"], [])

    def test_add_anime(self):
        data = self._add_media("anime", 1, "Watching", 24)

        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["username"], "test")
        self.assertEqual(data["media_id"], 1)
        self.assertEqual(data["media_name"], "Attack on Titan")
        self.assertEqual(data["all_status"], [status.value for status in Status.by(MediaType.ANIME)])
        self.assertEqual(data["status"], "Watching")
        self.assertEqual(data["media_cover"].startswith("/api/static/covers/anime_covers/"), True)
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["redo"], 0)
        self.assertEqual(data["current_season"], 1)
        self.assertEqual(data["eps_per_season"], [25, 12, 22, 28])
        self.assertEqual(data["last_episode_watched"], 1)
        self.assertEqual(data["rating"], {"type": "score", "value": None})
        self.assertEqual(data["favorite"], None)
        self.assertEqual(data["comment"], None)
        self.assertEqual(data["labels"], [])

    def test_add_movies(self):
        data = self._add_media("movies", 1, "Completed", 169)

        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["username"], "test")
        self.assertEqual(data["media_id"], 1)
        self.assertEqual(data["media_name"], "Interstellar")
        self.assertEqual(data["all_status"], [status.value for status in Status.by(MediaType.MOVIES)])
        self.assertEqual(data["status"], "Completed")
        self.assertEqual(data["media_cover"].startswith("/api/static/covers/movies_covers/"), True)
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["redo"], 0)
        self.assertEqual(data["rating"], {"type": "score", "value": None})
        self.assertEqual(data["favorite"], None)
        self.assertEqual(data["comment"], None)
        self.assertEqual(data["labels"], [])

    def test_add_books(self):
        from backend.api.models.books import BooksList

        data = self._add_media("books", 1, "Completed", 322 * BooksList.TIME_PER_PAGE)

        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["username"], "test")
        self.assertEqual(data["media_id"], 1)
        self.assertEqual(data["media_name"], "Harry Potter à L'école des Sorciers")
        self.assertEqual(data["all_status"], [status.value for status in Status.by(MediaType.BOOKS)])
        self.assertEqual(data["status"], "Completed")
        self.assertEqual(data["media_cover"].startswith("/api/static/covers/books_covers/"), True)
        self.assertEqual(data["total"], 322)
        self.assertEqual(data["total_pages"], 322)
        self.assertEqual(data["redo"], 0)
        self.assertEqual(data["rating"], {"type": "score", "value": None})
        self.assertEqual(data["favorite"], None)
        self.assertEqual(data["comment"], None)
        self.assertEqual(data["labels"], [])

    def test_add_games(self):
        data = self._add_media("games", 1, "Playing", 0)

        self.assertEqual(data["user_id"], 1)
        self.assertEqual(data["username"], "test")
        self.assertEqual(data["media_id"], 1)
        self.assertEqual(data["media_name"], "Elden Ring")
        self.assertEqual(data["all_status"], [status.value for status in Status.by(MediaType.GAMES)])
        self.assertEqual(data["status"], "Playing")
        self.assertEqual(data["media_cover"].startswith("/api/static/covers/games_covers/"), True)
        self.assertEqual(data["playtime"], 0)
        self.assertEqual(data["rating"], {"type": "score", "value": None})
        self.assertEqual(data["favorite"], None)
        self.assertEqual(data["comment"], None)
        self.assertEqual(data["labels"], [])

    def test_delete_media(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            json_data = dict(media_id=1, media_type=media_type, payload="Completed")

            rv = self.client.post("/api/delete_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 404)

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 200)

            rv = self.client.post("/api/delete_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 204)

            rv = self.client.get("/api/current_user", headers=headers)
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(next((s["time_spent"] for s in rv.json["settings"] if s["media_type"] == media_type)), 0)

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 200)

    def test_update_favorite(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            json_data = dict(media_id=1, media_type=media_type, payload=True)

            # Media not found
            rv = self.client.post("/api/update_favorite", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 404)

            # Add media
            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "Completed",
            })
            self.assertEqual(rv.status_code, 200)

            # Add favorite
            rv = self.client.post("/api/update_favorite", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 204)

            # Bad payload
            rv = self.client.post("/api/update_favorite", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "toto",
            })
            self.assertEqual(rv.status_code, 400)

            # Update favorite
            rv = self.client.post("/api/update_favorite", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": False,
            })
            self.assertEqual(rv.status_code, 204)

    def test_update_status(self):
        headers = self.connexion()
        self.create_all_media()

        statuses = ["Watching", "Watching", "Completed", "Reading", "Playing"]
        times = [2480, 2088, 169, 547.4, 0]

        for media_type, status, time in zip(MediaType, statuses, times):
            json_data = dict(media_id=1, media_type=media_type, payload=status)

            # Media not found
            rv = self.client.post("/api/update_status", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 404)

            # Add media
            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 200)

            # Bad payload
            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "toto",
            })
            self.assertEqual(rv.status_code, 400)

            # Update status
            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "Completed",
            })
            self.assertEqual(rv.status_code, 204)

            # Check time spent associated with status
            rv = self.client.get("/api/current_user", headers=headers)
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(next((s["time_spent"] for s in rv.json["settings"] if s["media_type"] == media_type)), time)

    def test_update_rating(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)
            json_data = dict(media_id=1, media_type=media_type, payload=8.5)

            rv = self.client.post("/api/update_rating", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 404)

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "Completed",
            })
            self.assertEqual(rv.status_code, 200)

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": 11,
            })
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": -5,
            })
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_rating", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.rating, 8.5)

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": None,
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.rating, None)

    def test_update_redo(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": 3,
            })
            self.assertEqual(rv.status_code, 404 if media_type != MediaType.GAMES else 400)

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "Completed",
            })
            self.assertEqual(rv.status_code, 200)

            if media_type == MediaType.GAMES:
                rv = self.client.post("/api/update_redo", headers=headers, json={
                    "media_id": 1,
                    "media_type": media_type,
                    "payload": 3,
                })
                self.assertEqual(rv.status_code, 400)
                continue

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": 11,
            })
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": -2,
            })
            self.assertEqual(rv.status_code, 400)

            # Round to int
            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": 7.5,
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.redo, 7)

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": 4,
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.redo, 4)

            payload = "Watching"
            if media_type == MediaType.MOVIES:
                payload = "Plan to Watch"
            elif media_type == MediaType.BOOKS:
                payload = "Reading"
            elif media_type == MediaType.GAMES:
                payload = "Playing"
            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": payload,
            })
            self.assertEqual(rv.status_code, 204)

            # Media needs to be Completed
            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": 5,
            })
            self.assertEqual(rv.status_code, 400)

    def test_update_comment(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

            rv = self.client.post("/api/update_comment", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "Test comment",
            })
            self.assertEqual(rv.status_code, 404)

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "Completed",
            })
            self.assertEqual(rv.status_code, 200)

            rv = self.client.post("/api/update_comment", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": self.TOO_LONG_COMMENT,
            })
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_comment", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "This is a valid comment",
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.comment, "This is a valid comment")

    def test_update_platform(self):
        headers = self.connexion()
        self.create_all_media()

        model_list = ModelsManager.get_unique_model(MediaType.GAMES, ModelTypes.LIST)

        rv = self.client.post("/api/update_platform", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": GamesPlatformsEnum.XBOX.value,
        })
        self.assertEqual(rv.status_code, 404)

        rv = self.client.post("/api/add_media", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": "Playing",
        })
        self.assertEqual(rv.status_code, 200)

        # Bad MediaType
        rv = self.client.post("/api/update_platform", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.SERIES.value,
            "payload": GamesPlatformsEnum.XBOX.value,
        })
        self.assertEqual(rv.status_code, 400)

        # Bad payload
        rv = self.client.post("/api/update_platform", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": "toto",
        })
        self.assertEqual(rv.status_code, 400)

        # Reset platform
        rv = self.client.post("/api/update_platform", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": None,
        })
        self.assertEqual(rv.status_code, 204)

        # Update platform
        rv = self.client.post("/api/update_platform", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": GamesPlatformsEnum.GAME_BOY_ADVANCE.value,
        })
        self.assertEqual(rv.status_code, 204)
        query = model_list.query.filter_by(user_id=1, media_id=1).first()
        self.assertEqual(query.platform, GamesPlatformsEnum.GAME_BOY_ADVANCE)

    def test_update_playtime(self):
        headers = self.connexion()
        self.create_all_media()

        model_list = ModelsManager.get_unique_model(MediaType.GAMES, ModelTypes.LIST)

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": 2000,
        })
        self.assertEqual(rv.status_code, 404)

        rv = self.client.post("/api/add_media", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": "Completed",
        })
        self.assertEqual(rv.status_code, 200)

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.SERIES.value,
            "payload": 5000,
        })
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": 660000,
        })
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": -500,
        })
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": 5000,
        })
        self.assertEqual(rv.status_code, 204)
        query = model_list.query.filter_by(user_id=1, media_id=1).first()
        self.assertEqual(query.playtime, 5000)

    def test_update_season(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in [MediaType.SERIES, MediaType.ANIME]:
            model_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

            json_data = {"media_id": 1, "media_type": media_type.value, "payload": 2}

            rv = self.client.post("/api/update_season", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 404)

            rv = self.client.post("/api/add_media", headers=headers, json={**json_data, "payload": "Watching"})
            self.assertEqual(rv.status_code, 200)

            rv = self.client.post("/api/update_season", headers=headers, json={**json_data, "payload": 467})
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_season", headers=headers, json={**json_data, "payload": -4})
            self.assertEqual(rv.status_code, 400)

            # Series has 5 seasons and Anime 4 seasons
            rv = self.client.post("/api/update_season", headers=headers, json={**json_data, "payload": 3})
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()

            if media_type == MediaType.SERIES:
                self.assertEqual(query.current_season, 3)
                self.assertEqual(query.last_episode_watched, 1)
                self.assertEqual(query.status, "Watching")
                self.assertEqual(query.total, 21)
            else:
                self.assertEqual(query.current_season, 3)
                self.assertEqual(query.last_episode_watched, 1)
                self.assertEqual(query.status, "Watching")
                self.assertEqual(query.total, 38)

    def test_update_episode(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in [MediaType.SERIES, MediaType.ANIME]:
            media_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

            json_data = dict(media_id=1, media_type=media_type.value, payload=2)

            rv = self.client.post("/api/update_episode", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 404)

            rv = self.client.post("/api/add_media", headers=headers, json={**json_data, "payload": "Watching"})
            self.assertEqual(rv.status_code, 200)

            rv = self.client.post("/api/update_episode", headers=headers, json={**json_data, "payload": 467})
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_episode", headers=headers, json={**json_data, "payload": -4})
            self.assertEqual(rv.status_code, 400)

            # Series has 5 seasons and Anime 4 seasons
            rv = self.client.post("/api/update_episode", headers=headers, json={**json_data, "payload": 3})
            self.assertEqual(rv.status_code, 204)
            query = media_list.query.filter_by(user_id=1, media_id=1).first()

            if media_type == MediaType.SERIES:
                self.assertEqual(query.current_season, 1)
                self.assertEqual(query.last_episode_watched, 3)
                self.assertEqual(query.status, "Watching")
                self.assertEqual(query.total, 3)
            else:
                self.assertEqual(query.current_season, 1)
                self.assertEqual(query.last_episode_watched, 3)
                self.assertEqual(query.status, "Watching")
                self.assertEqual(query.total, 3)

    def test_update_page(self):
        headers = self.connexion()
        self.create_all_media()

        model_list = ModelsManager.get_unique_model(MediaType.BOOKS, ModelTypes.LIST)

        rv = self.client.post("/api/update_page", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.BOOKS.value,
            "payload": 70,
        })
        self.assertEqual(rv.status_code, 404)

        rv = self.client.post("/api/add_media", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.BOOKS.value,
            "payload": "Reading",
        })
        self.assertEqual(rv.status_code, 200)

        # Bad MediaType
        rv = self.client.post("/api/update_page", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.SERIES.value,
            "payload": 50,
        })
        self.assertEqual(rv.status_code, 400)

        # Bad payload
        rv = self.client.post("/api/update_page", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.BOOKS.value,
            "payload": "bad payload",
        })
        self.assertEqual(rv.status_code, 400)

        # Bad payload
        rv = self.client.post("/api/update_page", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.BOOKS.value,
            "payload": -50,
        })
        self.assertEqual(rv.status_code, 400)

        # Bad payload (`books.json` in `/tests/media` has 322 pages)
        rv = self.client.post("/api/update_page", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.BOOKS.value,
            "payload": 350,
        })
        self.assertEqual(rv.status_code, 400)

        # Update page
        rv = self.client.post("/api/update_page", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.BOOKS.value,
            "payload": 50,
        })
        self.assertEqual(rv.status_code, 204)
        query = model_list.query.filter_by(user_id=1, media_id=1).first()
        self.assertEqual(query.actual_page, 50)

        # Page to 0
        rv = self.client.post("/api/update_page", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.BOOKS.value,
            "payload": 0,
        })
        self.assertEqual(rv.status_code, 204)
        query = model_list.query.filter_by(user_id=1, media_id=1).first()
        self.assertEqual(query.actual_page, 0)

    def test_coming_next(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType.default():
            if media_type == MediaType.SERIES:
                attribute = "next_episode_to_air"
            else:
                attribute = "release_date"
            media_model = ModelsManager.get_unique_model(media_type, ModelTypes.MEDIA)
            media_model.query.filter_by(id=1).update({attribute: naive_utcnow() + timedelta(days=3)})
            db.session.commit()

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type,
                "payload": "Watching" if media_type == MediaType.SERIES else "Plan to Watch",
            })
            self.assertEqual(rv.status_code, 200)

        rv = self.client.get("/api/coming_next", headers=headers)
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]), 2)

        media_types = MediaType.default()
        for media, media_type in zip(rv.json["data"], media_types):
            self.assertEqual(media["media_type"], media_type)
            for item in media["items"]:
                self.assertIn("media_id", item)
                self.assertIn("media_name", item)
                self.assertIn("media_cover", item)
                self.assertIn("date", item)
                self.assertIn("season_to_air", item)
                self.assertIn("episode_to_air", item)
