import json
import os
from datetime import datetime
from typing import Dict
from backend.api.utils.enums import MediaType, ModelTypes
from backend.api.utils.functions import ModelsFetcher
from backend.tests.base_test import BaseTest


class MediaTests(BaseTest):
    access_token: str = None

    @staticmethod
    def create_all_media():
        from backend.api.data_managers.api_data_manager import ApiData

        media_files = ["series.json", "anime.json", "movies.json", "books.json", "games.json"]

        for media_type, media_file in zip(MediaType, media_files):
            with open(os.path.join(os.path.abspath("."), f"backend/tests/media/{media_file}")) as fp:
                media_data = json.load(fp)

            API_class = ApiData.get_API_class(media_type)()
            API_class.all_data = media_data
            API_class.all_data["media_data"]["last_api_update"] = datetime.utcnow()
            if media_type == MediaType.BOOKS:
                del API_class.all_data["media_data"]["last_api_update"]
            API_class._add_data_to_db()

    def add_media(self, media_type: str, media_id: int, status: str, time_spent: float) -> Dict:
        self.create_all_media()

        rv = self.client.post("/api/add_media")
        assert rv.status_code == 401

        headers = self.connexion()

        rv = self.client.get("/api/current_user", headers=headers)
        assert rv.status_code == 200

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
            assert rv.status_code == 400

        rv_good = self.client.post("/api/add_media", headers=headers, json={
            "media_id": media_id,
            "media_type": media_type,
            "payload": status,
        })
        assert rv_good.status_code == 200

        # Media already in <test> media list
        rv = self.client.post("/api/add_media", headers=headers, json={
            "media_id": media_id,
            "media_type": media_type,
            "payload": status,
        })
        assert rv.status_code == 400

        # Check time spent
        rv = self.client.get("/api/current_user", headers=headers)
        assert rv.status_code == 200
        assert rv.json[f"time_spent_{media_type}"] == time_spent
        return rv_good.json["data"]

    def test_add_series(self):
        data = self.add_media("series", 1, "Watching", 40)

        assert data["user_id"] == 1
        assert data["username"] == "test"
        assert data["media_id"] == 1
        assert data["media_name"] == "Breaking Bad"
        assert data["all_status"] == ["Watching", "Completed", "On Hold", "Random", "Dropped", "Plan to Watch"]
        assert data["status"] == "Watching"
        assert data["media_cover"].startswith("/api/static/covers/series_covers/")
        assert data["total"] == 1
        assert data["rewatched"] == 0
        assert data["current_season"] == 1
        assert data["eps_per_season"] == [7, 13, 13, 13, 16]
        assert data["last_episode_watched"] == 1
        assert data["rating"] == {"type": "score", "value": None}
        assert data["favorite"] is None
        assert data["comment"] is None
        assert data["labels"] == {"already_in": [], "available": []}
        assert data["history"][0]["media_id"] == 1
        assert data["history"][0]["media_name"] == "Breaking Bad"
        assert data["history"][0]["media_type"] == "series"
        assert data["history"][0]["update"][0] == "Watching"
        assert "date" in data["history"][0]

    def test_add_anime(self):
        data = self.add_media("anime", 1, "Watching", 24)

        assert data["user_id"] == 1
        assert data["username"] == "test"
        assert data["media_id"] == 1
        assert data["media_name"] == "Attack on Titan"
        assert data["all_status"] == ["Watching", "Completed", "On Hold", "Random", "Dropped", "Plan to Watch"]
        assert data["status"] == "Watching"
        assert data["media_cover"].startswith("/api/static/covers/anime_covers/")
        assert data["total"] == 1
        assert data["rewatched"] == 0
        assert data["current_season"] == 1
        assert data["eps_per_season"] == [25, 12, 22, 28]
        assert data["last_episode_watched"] == 1
        assert data["rating"] == {"type": "score", "value": None}
        assert data["favorite"] is None
        assert data["comment"] is None
        assert data["labels"] == {"already_in": [], "available": []}
        assert data["history"][0]["media_id"] == 1
        assert data["history"][0]["media_name"] == "Attack on Titan"
        assert data["history"][0]["media_type"] == "anime"
        assert data["history"][0]["update"][0] == "Watching"
        assert "date" in data["history"][0]

    def test_add_movies(self):
        data = self.add_media("movies", 1, "Completed", 169)

        assert data["user_id"] == 1
        assert data["username"] == "test"
        assert data["media_id"] == 1
        assert data["media_name"] == "Interstellar"
        assert data["all_status"] == ["Completed", "Plan to Watch"]
        assert data["status"] == "Completed"
        assert data["media_cover"].startswith("/api/static/covers/movies_covers/")
        assert data["total"] == 1
        assert data["rewatched"] == 0
        assert data["rating"] == {"type": "score", "value": None}
        assert data["favorite"] is None
        assert data["comment"] is None
        assert data["labels"] == {"already_in": [], "available": []}
        assert data["history"][0]["media_id"] == 1
        assert data["history"][0]["media_name"] == "Interstellar"
        assert data["history"][0]["media_type"] == "movies"
        assert data["history"][0]["update"] == ["Completed"]
        assert "date" in data["history"][0]

    def test_add_books(self):
        from backend.api.models.books_models import BooksList

        data = self.add_media("books", 1, "Completed", 322 * BooksList.TIME_PER_PAGE)

        assert data["user_id"] == 1
        assert data["username"] == "test"
        assert data["media_id"] == 1
        assert data["media_name"] == "Harry Potter à L'école des Sorciers"
        assert data["all_status"] == ["Reading", "Completed", "On Hold", "Dropped", "Plan to Read"]
        assert data["status"] == "Completed"
        assert data["media_cover"].startswith("/api/static/covers/books_covers/")
        assert data["total"] == 322
        assert data["total_pages"] == 322
        assert data["rewatched"] == 0
        assert data["rating"] == {"type": "score", "value": None}
        assert data["favorite"] is None
        assert data["comment"] is None
        assert data["labels"] == {"already_in": [], "available": []}
        assert data["history"][0]["media_id"] == 1
        assert data["history"][0]["media_name"] == "Harry Potter à L'école des Sorciers"
        assert data["history"][0]["media_type"] == "books"
        assert data["history"][0]["update"] == ["Completed"]
        assert "date" in data["history"][0]

    def test_add_games(self):
        data = self.add_media("games", 1, "Playing", 0)

        assert data["user_id"] == 1
        assert data["username"] == "test"
        assert data["media_id"] == 1
        assert data["media_name"] == "Elden Ring"
        assert data["all_status"] == ["Playing", "Completed", "Multiplayer", "Endless", "Dropped", "Plan to Play"]
        assert data["status"] == "Playing"
        assert data["media_cover"].startswith("/api/static/covers/games_covers/")
        assert data["playtime"] == 0
        assert data["rating"] == {"type": "score", "value": None}
        assert data["favorite"] is None
        assert data["comment"] is None
        assert data["labels"] == {"already_in": [], "available": []}
        assert data["history"][0]["media_id"] == 1
        assert data["history"][0]["media_name"] == "Elden Ring"
        assert data["history"][0]["media_type"] == "games"
        assert data["history"][0]["update"] == ["Playing"]
        assert "date" in data["history"][0]

    def test_delete_media(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            json_data = {
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            }

            rv = self.client.post("/api/delete_media", headers=headers, json=json_data)
            assert rv.status_code == 400

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            assert rv.status_code == 200

            rv = self.client.post("/api/delete_media", headers=headers, json=json_data)
            assert rv.status_code == 204

            rv = self.client.get("/api/current_user", headers=headers)
            assert rv.status_code == 200
            assert rv.json[f"time_spent_{media_type.value}"] == 0

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            assert rv.status_code == 200

    def test_update_favorite(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            json_data = {
                "media_id": 1,
                "media_type": media_type.value,
                "payload": True,
            }

            rv = self.client.post("/api/update_favorite", headers=headers, json=json_data)
            assert rv.status_code == 404

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })
            assert rv.status_code == 200

            rv = self.client.post("/api/update_favorite", headers=headers, json=json_data)
            assert rv.status_code == 204

            rv = self.client.post("/api/update_favorite", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "toto",
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/update_favorite", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": False,
            })
            assert rv.status_code == 204

    def test_update_status(self):
        headers = self.connexion()
        self.create_all_media()

        statuses = ["Watching", "Watching", "Watching", "Reading", "Playing"]
        times = [2480, 2088, 169, 547.4, 0]

        for media_type, status, time in zip(MediaType, statuses, times):
            json_data = {
                "media_id": 1,
                "media_type": media_type.value,
                "payload": status,
            }

            rv = self.client.post("/api/update_status", headers=headers, json=json_data)
            assert rv.status_code == 404

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            assert rv.status_code == 200

            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "toto",
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })
            assert rv.status_code == 204

            rv = self.client.get("/api/current_user", headers=headers)
            assert rv.status_code == 200
            assert rv.json[f"time_spent_{media_type.value}"] == time

    def test_update_rating_score(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsFetcher.get_unique_model(media_type, ModelTypes.LIST)

            json_data = {
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 8.5,
            }

            rv = self.client.post("/api/update_rating", headers=headers, json=json_data)
            assert rv.status_code == 404

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })
            assert rv.status_code == 200

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 11,
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": -5,
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/update_rating", headers=headers, json=json_data)
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.score == 8.5

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "--",
            })
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.score is None

    def test_update_rating_feeling(self):
        headers = self.connexion()

        # Change from score to feeling for user
        rv = self.client.post("/api/settings/medialist", headers=headers, json={"add_feeling": True})
        assert rv.status_code == 200

        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsFetcher.get_unique_model(media_type, ModelTypes.LIST)

            self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 6,
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": -2,
            })
            assert rv.status_code == 400

            # Round to int
            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 3.5,
            })
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.feeling == "3"

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 4,
            })
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.feeling == "4"

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "--",
            })
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.feeling is None

    def test_update_redo(self):

        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsFetcher.get_unique_model(media_type, ModelTypes.LIST)

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 3,
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })
            assert rv.status_code == 200

            if media_type == MediaType.GAMES:
                rv = self.client.post("/api/update_redo", headers=headers, json={
                    "media_id": 1,
                    "media_type": media_type.value,
                    "payload": 3,
                })
                assert rv.status_code == 400

                continue

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 11,
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": -2,
            })
            assert rv.status_code == 400

            # Round to int
            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 7.5,
            })
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.rewatched == 7

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 4,
            })
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.rewatched == 4

            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Watching",
            })
            assert rv.status_code == 204

            # Media needs to be Completed
            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 5,
            })
            assert rv.status_code == 400

    def test_update_comment(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsFetcher.get_unique_model(media_type, ModelTypes.LIST)

            rv = self.client.post("/api/update_comment", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "yes",
            })
            assert rv.status_code == 404

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })
            assert rv.status_code == 200

            rv = self.client.post("/api/update_comment", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": """
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the 
                industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type 
                and scrambled it to make a type specimen book. It has survived not only five centuries, but also the 
                leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s 
                with the release ofLetraset sheets containing Lorem Ipsum passages, and more recently with desktop
                publishing software like Aldus PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy 
                text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text 
                ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type
                specimen book. It has survived not only five centuries, but also the leap into electronic typesetting,
                remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets 
                containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus 
                PageMaker including versions of Lorem Ipsum.Lorem Ipsum is simply dummy text of the printing and 
                typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, 
                when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has 
                survived not only five centuries, but also the leap into electronic typesetting, remaining essentially 
                unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum 
                passages, and more recently with desktop publishing software like Aldus PageMaker including versions 
                of Lorem Ipsum. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum 
                has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a 
                galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, 
                but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised
                in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently
                with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
				""",
            })
            assert rv.status_code == 400

            rv = self.client.post("/api/update_comment", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "This is a comment",
            })
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            assert query.comment == "This is a comment"

    def test_update_playtime(self):
        headers = self.connexion()
        self.create_all_media()

        model_list = ModelsFetcher.get_unique_model(MediaType.GAMES, ModelTypes.LIST)

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": 2000,
        })
        assert rv.status_code == 404

        rv = self.client.post("/api/add_media", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": "Completed",
        })
        assert rv.status_code == 200

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.SERIES.value,
            "payload": 11000,
        })
        assert rv.status_code == 400

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": 11000,
        })
        assert rv.status_code == 400

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": -500,
        })
        assert rv.status_code == 400

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": 123.27,
        })
        assert rv.status_code == 204
        query = model_list.query.filter_by(user_id=1, media_id=1).first()
        assert query.playtime == 123 * 60  # playtime converted in [min]

        rv = self.client.post("/api/update_playtime", headers=headers, json={
            "media_id": 1,
            "media_type": MediaType.GAMES.value,
            "payload": 5000,
        })
        assert rv.status_code == 204
        query = model_list.query.filter_by(user_id=1, media_id=1).first()
        assert query.playtime == 5000 * 60  # playtime converted in [min]

    def test_update_season(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in [MediaType.SERIES, MediaType.ANIME]:
            model_list = ModelsFetcher.get_unique_model(media_type, ModelTypes.LIST)

            json_data = dict(media_id=1, media_type=media_type.value, payload=2)

            rv = self.client.post("/api/update_season", headers=headers, json=json_data)
            assert rv.status_code == 404

            rv = self.client.post("/api/add_media", headers=headers, json={**json_data, "payload": "Watching"})
            assert rv.status_code == 200

            rv = self.client.post("/api/update_season", headers=headers, json={**json_data, "payload": 467})
            assert rv.status_code == 400

            rv = self.client.post("/api/update_season", headers=headers, json={**json_data, "payload": -4})
            assert rv.status_code == 400

            # Series has 5 seasons and Anime 4 seasons
            rv = self.client.post("/api/update_season", headers=headers, json={**json_data, "payload": 3})
            assert rv.status_code == 204
            query = model_list.query.filter_by(user_id=1, media_id=1).first()

            if media_type == MediaType.SERIES:
                assert query.current_season == 3
                assert query.last_episode_watched == 1
                assert query.status == "Watching"
                assert query.total == 21
            else:
                assert query.current_season == 3
                assert query.last_episode_watched == 1
                assert query.status == "Watching"
                assert query.total == 38

    def test_update_episode(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in [MediaType.SERIES, MediaType.ANIME]:
            media_list = ModelsFetcher.get_unique_model(media_type, ModelTypes.LIST)

            json_data = dict(media_id=1, media_type=media_type.value, payload=2)

            rv = self.client.post("/api/update_episode", headers=headers, json=json_data)
            assert rv.status_code == 404

            rv = self.client.post("/api/add_media", headers=headers, json={**json_data, "payload": "Watching"})
            assert rv.status_code == 200

            rv = self.client.post("/api/update_episode", headers=headers, json={**json_data, "payload": 467})
            assert rv.status_code == 400

            rv = self.client.post("/api/update_episode", headers=headers, json={**json_data, "payload": -4})
            assert rv.status_code == 400

            # Series has 5 seasons and Anime 4 seasons
            rv = self.client.post("/api/update_episode", headers=headers, json={**json_data, "payload": 3})
            assert rv.status_code == 204
            query = media_list.query.filter_by(user_id=1, media_id=1).first()

            if media_type == MediaType.SERIES:
                assert query.current_season == 1
                assert query.last_episode_watched == 3
                assert query.status == "Watching"
                assert query.total == 3
            else:
                assert query.current_season == 1
                assert query.last_episode_watched == 3
                assert query.status == "Watching"
                assert query.total == 3

    def test_update_page(self):
        pass
