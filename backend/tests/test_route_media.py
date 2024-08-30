import json
import os
from datetime import datetime
from typing import Dict
from backend.api.utils.enums import MediaType, ModelTypes, Status, GamesPlatformsEnum
from backend.api.managers.ModelsManager import ModelsManager
from backend.tests.base_test import BaseTest


class MediaTests(BaseTest):
    @staticmethod
    def create_all_media():
        from backend.api.managers.ApiManager import ApiManager

        media_files = ["series.json", "anime.json", "movies.json", "books.json", "games.json"]
        base_dir = os.path.abspath(os.path.dirname(__file__))

        for media_type, media_file in zip(MediaType, media_files):
            with open(f"{base_dir}/media/{media_file}") as fp:
                media_data = json.load(fp)

            api_manager = ApiManager.get_subclass(media_type)()
            api_manager.all_data = media_data
            api_manager.all_data["media_data"]["last_api_update"] = datetime.utcnow()
            api_manager._add_data_to_db()

    def add_media(self, media_type: str, media_id: int, status: str, time_spent: float) -> Dict:
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
            self.assertEqual(rv.status_code, 400)

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
        self.assertEqual(rv.json["settings"][media_type]["time_spent"], time_spent)

        return rv_good.json["data"]

    def test_add_series(self):
        data = self.add_media("series", 1, "Watching", 40)

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
        self.assertEqual(data["labels"], {"already_in": [], "available": []})
        self.assertEqual(data["history"][0]["media_id"], 1)
        self.assertEqual(data["history"][0]["media_name"], "Breaking Bad")
        self.assertEqual(data["history"][0]["media_type"], "series")
        self.assertEqual(data["history"][0]["update_type"], "status")
        self.assertEqual(data["history"][0]["payload"], {"old_value": None, "new_value": "Watching"})
        self.assertEqual("timestamp" in data["history"][0], True)

    def test_add_anime(self):
        data = self.add_media("anime", 1, "Watching", 24)

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
        self.assertEqual(data["labels"], {"already_in": [], "available": []})
        self.assertEqual(data["history"][0]["media_id"], 1)
        self.assertEqual(data["history"][0]["media_name"], "Attack on Titan")
        self.assertEqual(data["history"][0]["media_type"], "anime")
        self.assertEqual(data["history"][0]["update_type"], "status")
        self.assertEqual(data["history"][0]["payload"], {"old_value": None, "new_value": "Watching"})
        self.assertEqual("timestamp" in data["history"][0], True)

    def test_add_movies(self):
        data = self.add_media("movies", 1, "Completed", 169)

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
        self.assertEqual(data["labels"], {"already_in": [], "available": []})
        self.assertEqual(data["history"][0]["media_id"], 1)
        self.assertEqual(data["history"][0]["media_name"], "Interstellar")
        self.assertEqual(data["history"][0]["media_type"], "movies")
        self.assertEqual(data["history"][0]["update_type"], "status")
        self.assertEqual(data["history"][0]["payload"], {"old_value": None, "new_value": "Completed"})
        self.assertEqual("timestamp" in data["history"][0], True)

    def test_add_books(self):
        from backend.api.models.books import BooksList

        data = self.add_media("books", 1, "Completed", 322 * BooksList.TIME_PER_PAGE)

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
        self.assertEqual(data["labels"], {"already_in": [], "available": []})
        self.assertEqual(data["history"][0]["media_id"], 1)
        self.assertEqual(data["history"][0]["media_name"], "Harry Potter à L'école des Sorciers")
        self.assertEqual(data["history"][0]["media_type"], "books")
        self.assertEqual(data["history"][0]["update_type"], "status")
        self.assertEqual(data["history"][0]["payload"], {"old_value": None, "new_value": "Completed"})
        self.assertEqual("timestamp" in data["history"][0], True)

    def test_add_games(self):
        data = self.add_media("games", 1, "Playing", 0)

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
        self.assertEqual(data["labels"], {"already_in": [], "available": []})
        self.assertEqual(data["history"][0]["media_id"], 1)
        self.assertEqual(data["history"][0]["media_name"], "Elden Ring")
        self.assertEqual(data["history"][0]["media_type"], "games")
        self.assertEqual(data["history"][0]["update_type"], "status")
        self.assertEqual(data["history"][0]["payload"], {"old_value": None, "new_value": "Playing"})
        self.assertEqual("timestamp" in data["history"][0], True)

    def test_delete_media(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            json_data = dict(media_id=1, media_type=media_type.value, payload="Completed")

            rv = self.client.post("/api/delete_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 200)

            rv = self.client.post("/api/delete_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 204)

            rv = self.client.get("/api/current_user", headers=headers)
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(rv.json["settings"][media_type.value]["time_spent"], 0)

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 200)

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
            json_data = dict(media_id=1, media_type=media_type.value, payload=status)

            rv = self.client.post("/api/update_status", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 404)

            rv = self.client.post("/api/add_media", headers=headers, json=json_data)
            self.assertEqual(rv.status_code, 200)

            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "toto",
            })
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })
            self.assertEqual(rv.status_code, 204)

            rv = self.client.get("/api/current_user", headers=headers)
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(rv.json["settings"][media_type.value]["time_spent"], time)

    def test_update_rating_score(self):
        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

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
        self.assertEqual(rv.status_code, 200)

        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

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
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": -2,
            })
            self.assertEqual(rv.status_code, 400)

            # Round to int
            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 3.5,
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.feeling, "3")

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 4,
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.feeling, "4")

            rv = self.client.post("/api/update_rating", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "--",
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.feeling, None)

    def test_update_redo(self):

        headers = self.connexion()
        self.create_all_media()

        for media_type in MediaType:
            model_list = ModelsManager.get_unique_model(media_type, ModelTypes.LIST)

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 3,
            })
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/add_media", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Completed",
            })
            self.assertEqual(rv.status_code, 200)

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
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": -2,
            })
            self.assertEqual(rv.status_code, 400)

            # Round to int
            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 7.5,
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.redo, 7)

            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": 4,
            })
            self.assertEqual(rv.status_code, 204)
            query = model_list.query.filter_by(user_id=1, media_id=1).first()
            self.assertEqual(query.redo, 4)

            rv = self.client.post("/api/update_status", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
                "payload": "Watching",
            })
            self.assertEqual(rv.status_code, 204)

            # Media needs to be Completed
            rv = self.client.post("/api/update_redo", headers=headers, json={
                "media_id": 1,
                "media_type": media_type.value,
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
