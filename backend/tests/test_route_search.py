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
        assert rv.json["data"]["items"][0]["name"] == "test"
        assert rv.json["data"]["items"][0]["media_type"] == "User"
        assert rv.json["data"]["items"][0]["image_cover"] == "/api/static/profile_pics/default.jpg"
        assert "date" in rv.json["data"]["items"][0]
        assert rv.json["data"]["total"] == 1
        assert rv.json["data"]["pages"] == 1

        rv = self.client.get("/api/autocomplete?q=bobby&selector=users", headers=self.connexion())
        self.assertEqual(rv.status_code, 200)
        assert len(rv.json["data"]["items"]) == 0
        assert rv.json["data"]["total"] == 0
        assert rv.json["data"]["pages"] == 0

        with mock.patch("backend.api.routes.search.User.create_search_results") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=test&selector=users", headers=self.connexion())
            self.assertEqual(rv.status_code, 400)

    def test_autocomplete_tmdb(self):
        with mock.patch("backend.api.routes.search.ApiTMDB.create_search_results") as mock_search:
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
            assert len(rv.json["data"]["items"]) == 1
            assert rv.json["data"]["items"][0]["api_id"] == 154
            assert rv.json["data"]["items"][0]["name"] == "Friends"
            assert rv.json["data"]["items"][0]["media_type"] == "series"
            assert rv.json["data"]["items"][0]["date"] == "1994-09-22"
            assert rv.json["data"]["items"][0]["image_cover"] == "https://example.com/friends.jpg"
            assert rv.json["data"]["total"] == 1
            assert rv.json["data"]["pages"] == 1
        with mock.patch("backend.api.routes.search.ApiTMDB.create_search_results") as mock_search:
            mock_search.return_value = {"items": [], "total": 0, "pages": 1}

            rv = self.client.get("/api/autocomplete?q=toto&selector=TMDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            assert len(rv.json["data"]["items"]) == 0
            assert rv.json["data"]["total"] == 0
            assert rv.json["data"]["pages"] == 1
        with mock.patch("backend.api.routes.search.ApiTMDB.search") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=friends&selector=TMDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 400)

    def test_autocomplete_igdb(self):
        with mock.patch("backend.api.routes.search.ApiGames.create_search_results") as mock_search:
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
            assert len(rv.json["data"]["items"]) == 1
            assert rv.json["data"]["items"][0]["api_id"] == 12
            assert rv.json["data"]["items"][0]["name"] == "Halo"
            assert rv.json["data"]["items"][0]["media_type"] == "games"
            assert rv.json["data"]["items"][0]["date"] == "2001-11-15"
            assert rv.json["data"]["items"][0]["image_cover"] == "https://example.com/halo.jpg"
            assert rv.json["data"]["total"] == 1
            assert rv.json["data"]["pages"] == 1
        with mock.patch("backend.api.routes.search.ApiGames.create_search_results") as mock_search:
            mock_search.return_value = {"items": [], "total": 0, "pages": 1}

            rv = self.client.get("/api/autocomplete?q=toto&selector=IGDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            assert len(rv.json["data"]["items"]) == 0
            assert rv.json["data"]["total"] == 0
            assert rv.json["data"]["pages"] == 1
        with mock.patch("backend.api.routes.search.ApiGames.search") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=halo&selector=IGDB", headers=self.connexion())
            self.assertEqual(rv.status_code, 400)

    def test_autocomplete_books(self):
        with mock.patch("backend.api.routes.search.ApiBooks.create_search_results") as mock_search:
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
            assert len(rv.json["data"]["items"]) == 1
            assert rv.json["data"]["items"][0]["api_id"] == "zfv467z7f"
            assert rv.json["data"]["items"][0]["name"] == "Harry Potter"
            assert rv.json["data"]["items"][0]["media_type"] == "books"
            assert rv.json["data"]["items"][0]["date"] == "1997-07-15"
            assert rv.json["data"]["items"][0]["image_cover"] == "https://example.com/harry_potter.jpg"
            assert rv.json["data"]["total"] == 1
            assert rv.json["data"]["pages"] == 1
        with mock.patch("backend.api.routes.search.ApiBooks.create_search_results") as mock_search:
            mock_search.return_value = {"items": [], "total": 0, "pages": 1}

            rv = self.client.get("/api/autocomplete?q=toto&selector=BOOKS", headers=self.connexion())
            self.assertEqual(rv.status_code, 200)
            assert len(rv.json["data"]["items"]) == 0
            assert rv.json["data"]["total"] == 0
            assert rv.json["data"]["pages"] == 1
        with mock.patch("backend.api.routes.search.ApiBooks.search") as mock_search:
            mock_search.side_effect = Exception("An Unexpected Exception occurred")

            rv = self.client.get("/api/autocomplete?q=harry%20potter&selector=BOOKS", headers=self.connexion())
            self.assertEqual(rv.status_code, 400)
