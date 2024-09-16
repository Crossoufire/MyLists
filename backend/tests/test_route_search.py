from unittest import mock

from backend.tests.base_test import BaseTest


class SearchTests(BaseTest):
    def test_autocomplete_general(self):
        rv = self.client.get("/api/autocomplete?q=test&selector=TMDB")
        self.assertEqual(rv.status_code, 401)

        rv = self.client.get("/api/autocomplete?q=test&selector=invalid", headers=self.connexion())
        self.assertEqual(rv.status_code, 400)

        rv = self.client.get("/api/autocomplete", headers=self.connexion())
        self.assertEqual(rv.status_code, 400)

    def test_autocomplete_users(self):
        rv = self.client.get("/api/autocomplete?q=test&selector=users", headers=self.connexion())
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["items"]), 1)
        self.assertEqual(rv.json["data"]["items"][0]["name"], "test")
        self.assertEqual(rv.json["data"]["items"][0]["media_type"], "User")
        self.assertEqual(rv.json["data"]["items"][0]["image_cover"], "/api/static/profile_pics/default.jpg")
        self.assertIn("date", rv.json["data"]["items"][0])
        self.assertEqual(rv.json["data"]["total"], 1)
        self.assertEqual(rv.json["data"]["pages"], 1)

        rv = self.client.get("/api/autocomplete?q=bobby&selector=users", headers=self.connexion())
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(len(rv.json["data"]["items"]), 0)
        self.assertEqual(rv.json["data"]["total"], 0)
        self.assertEqual(rv.json["data"]["pages"], 0)

        with mock.patch("backend.api.routes.search.User.create_search_results") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=test&selector=users", headers=self.connexion())
            self.assertEqual(rv.status_code, 500)

    def test_autocomplete_tmdb(self):
        with mock.patch("backend.api.routes.search.TMDBApiManager.create_search_results") as mock_search:
            mock_search.return_value = {
                "items": [{
                    "api_id": 154,
                    "name": "Friends",
                    "media_type": "series",
                    "date": "1994-09-22",
                    "image_cover": "https://example.com/friends.jpg",
                }],
                "total": 1,
                "pages": 1,
            }

            rv = self.client.get("/api/autocomplete?q=friends&selector=TMDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(len(rv.json["data"]["items"]), 1)
            self.assertEqual(rv.json["data"]["items"][0]["api_id"], 154)
            self.assertEqual(rv.json["data"]["items"][0]["name"], "Friends")
            self.assertEqual(rv.json["data"]["items"][0]["media_type"], "series")
            self.assertEqual(rv.json["data"]["items"][0]["date"], "1994-09-22")
            self.assertEqual(rv.json["data"]["items"][0]["image_cover"], "https://example.com/friends.jpg")
            self.assertEqual(rv.json["data"]["total"], 1)
            self.assertEqual(rv.json["data"]["pages"], 1)

        with mock.patch("backend.api.routes.search.TMDBApiManager.create_search_results") as mock_search:
            mock_search.return_value = {"items": [], "total": 0, "pages": 1}

            rv = self.client.get("/api/autocomplete?q=toto&selector=TMDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(len(rv.json["data"]["items"]), 0)
            self.assertEqual(rv.json["data"]["total"], 0)
            self.assertEqual(rv.json["data"]["pages"], 1)
        with mock.patch("backend.api.routes.search.TMDBApiManager.search") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=friends&selector=TMDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 500)

    def test_autocomplete_igdb(self):
        with mock.patch("backend.api.routes.search.GamesApiManager.create_search_results") as mock_search:
            mock_search.return_value = {
                "items": [{
                    "api_id": 12,
                    "name": "Halo",
                    "media_type": "games",
                    "date": "2001-11-15",
                    "image_cover": "https://example.com/halo.jpg",
                }],
                "total": 1,
                "pages": 1,
            }

            rv = self.client.get("/api/autocomplete?q=halo&selector=IGDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(len(rv.json["data"]["items"]), 1)
            self.assertEqual(rv.json["data"]["items"][0]["api_id"], 12)
            self.assertEqual(rv.json["data"]["items"][0]["name"], "Halo")
            self.assertEqual(rv.json["data"]["items"][0]["media_type"], "games")
            self.assertEqual(rv.json["data"]["items"][0]["date"], "2001-11-15")
            self.assertEqual(rv.json["data"]["items"][0]["image_cover"], "https://example.com/halo.jpg")
            self.assertEqual(rv.json["data"]["total"], 1)
            self.assertEqual(rv.json["data"]["pages"], 1)
        with mock.patch("backend.api.routes.search.GamesApiManager.create_search_results") as mock_search:
            mock_search.return_value = {"items": [], "total": 0, "pages": 1}

            rv = self.client.get("/api/autocomplete?q=toto&selector=IGDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(len(rv.json["data"]["items"]), 0)
            self.assertEqual(rv.json["data"]["total"], 0)
            self.assertEqual(rv.json["data"]["pages"], 1)
        with mock.patch("backend.api.routes.search.GamesApiManager.search") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=halo&selector=IGDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 500)

    def test_autocomplete_books(self):
        with mock.patch("backend.api.routes.search.BooksApiManager.create_search_results") as mock_search:
            mock_search.return_value = {
                "items": [{
                    "api_id": "zfv467z7f",
                    "name": "Harry Potter",
                    "media_type": "books",
                    "date": "1997-07-15",
                    "image_cover": "https://example.com/harry_potter.jpg"
                }],
                "total": 1,
                "pages": 1
            }

            rv = self.client.get("/api/autocomplete?q=harry%20potter&selector=BOOKS", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(len(rv.json["data"]["items"]), 1)
            self.assertEqual(rv.json["data"]["items"][0]["api_id"], "zfv467z7f")
            self.assertEqual(rv.json["data"]["items"][0]["name"], "Harry Potter")
            self.assertEqual(rv.json["data"]["items"][0]["media_type"], "books")
            self.assertEqual(rv.json["data"]["items"][0]["date"], "1997-07-15")
            self.assertEqual(rv.json["data"]["items"][0]["image_cover"], "https://example.com/harry_potter.jpg")
            self.assertEqual(rv.json["data"]["total"], 1)
            self.assertEqual(rv.json["data"]["pages"], 1)

        with mock.patch("backend.api.routes.search.BooksApiManager.create_search_results") as mock_search:
            mock_search.return_value = {"items": [], "total": 0, "pages": 1}

            rv = self.client.get("/api/autocomplete?q=toto&selector=BOOKS", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            self.assertEqual(len(rv.json["data"]["items"]), 0)
            self.assertEqual(rv.json["data"]["total"], 0)
            self.assertEqual(rv.json["data"]["pages"], 1)

        with mock.patch("backend.api.routes.search.BooksApiManager.search") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=harry%20potter&selector=BOOKS", headers=self.connexion())
            self.assertEqual(rv.status_code, 500)
