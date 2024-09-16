from datetime import datetime, timedelta
from unittest import mock

from backend.tests.base_test import BaseTest, TEST_USER


class AuthTests(BaseTest):
    def _get_token(self):
        rv = self.client.post("/api/tokens", auth=(TEST_USER["username"], TEST_USER["password"]))
        self.assertEqual(rv.status_code, 200)
        return rv

    def test_no_auth(self):
        rv = self.client.get("/api/current_user")
        self.assertEqual(rv.status_code, 401)

    def test_no_login(self):
        rv = self.client.post("/api/tokens")
        self.assertEqual(rv.status_code, 401)

    def test_bad_login(self):
        rv = self.client.post("/api/tokens", auth=(TEST_USER["username"], "bad-password"))
        self.assertEqual(rv.status_code, 401)

    def test_get_token(self):
        rv = self._get_token()

        access_token = rv.json["access_token"]
        refresh_token = rv.headers["Set-Cookie"].split(";")[0].split("=")[1]

        rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token}"})
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["username"], TEST_USER["username"])

        rv = self.client.get("/api/current_user", headers={"Authorization": f'Bearer {access_token + "x"}'})
        self.assertEqual(rv.status_code, 401)

        rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {refresh_token}"})
        self.assertEqual(rv.status_code, 401)

    def test_token_expired(self):
        rv = self._get_token()

        access_token = rv.json["access_token"]

        with mock.patch("backend.api.models.user.datetime") as dt:
            dt.utcnow.return_value = datetime.utcnow() + timedelta(days=1)
            rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token}"})
            self.assertEqual(rv.status_code, 401)

    def test_refresh_token(self):
        rv = self._get_token()

        access_token1 = rv.json["access_token"]
        refresh_token1 = rv.headers["Set-Cookie"].split(";")[0].split("=")[1]

        self.client.set_cookie("refresh_token", refresh_token1)
        rv = self.client.put("/api/tokens", json={"access_token": access_token1})
        self.assertEqual(rv.status_code, 200)

        self.assertNotEqual(rv.json["access_token"], access_token1)
        self.assertNotEqual(rv.headers["Set-Cookie"].split(";")[0].split("=")[1], refresh_token1)

        access_token2 = rv.json["access_token"]

        rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token2}"})
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["username"], TEST_USER["username"])

        rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token1}"})
        self.assertEqual(rv.status_code, 401)

    def test_refresh_token_failure(self):
        rv = self._get_token()

        access_token = rv.json["access_token"]

        self.client.delete_cookie("refresh_token", path="/api/tokens")
        rv = self.client.put("/api/tokens", json={"access_token": access_token})
        self.assertEqual(rv.status_code, 401)

    def test_revoke(self):
        rv = self._get_token()

        access_token = rv.json["access_token"]
        header = {"Authorization": f"Bearer {access_token}"}

        rv = self.client.get("/api/current_user", headers=header)
        self.assertEqual(rv.status_code, 200)

        rv = self.client.delete("/api/tokens", headers=header)
        self.assertEqual(rv.status_code, 204)

        rv = self.client.get("/api/current_user", headers=header)
        self.assertEqual(rv.status_code, 401)

    def test_refresh_revoke_all(self):
        rv = self._get_token()

        access_token1 = rv.json["access_token"]
        refresh_token1 = rv.headers["Set-Cookie"].split(";")[0].split("=")[1]

        rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token1}"})
        self.assertEqual(rv.status_code, 200)

        rv = self.client.post("/api/tokens", auth=(TEST_USER["username"], TEST_USER["password"]))
        self.assertEqual(rv.status_code, 200)

        access_token2 = rv.json["access_token"]
        refresh_token2 = rv.headers["Set-Cookie"].split(";")[0].split("=")[1]

        self.client.set_cookie("refresh_token", refresh_token2, path="/api/tokens")
        rv = self.client.put("/api/tokens", json={"access_token": access_token2})
        self.assertEqual(rv.status_code, 200)

        access_token3 = rv.json["access_token"]
        refresh_token3 = rv.headers["Set-Cookie"].split(";")[0].split("=")[1]

        self.client.set_cookie("refresh_token", refresh_token2, path="/api/tokens")
        rv = self.client.put("/api/tokens", json={"access_token": access_token2})
        self.assertEqual(rv.status_code, 401)

        rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token1}"})
        self.assertEqual(rv.status_code, 401)

        rv = self.client.get('/api/current_user', headers={'Authorization': f"Bearer {access_token2}"})
        self.assertEqual(rv.status_code, 401)

        rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token3}"})
        self.assertEqual(rv.status_code, 401)

        self.client.set_cookie("refresh_token", refresh_token1, path="/api/tokens")
        rv = self.client.put("/api/tokens", json={"access_token": access_token1})
        self.assertEqual(rv.status_code, 401)

        self.client.set_cookie("refresh_token", refresh_token2, path="/api/tokens")
        rv = self.client.put("/api/tokens", json={"access_token": access_token2})
        self.assertEqual(rv.status_code, 401)

        self.client.set_cookie("refresh_token", refresh_token3, path="/api/tokens")
        rv = self.client.put("/api/tokens", json={"access_token": access_token3})
        self.assertEqual(rv.status_code, 401)

    def test_oauth(self):
        rv = self.client.get("/api/tokens/oauth2/bar")
        self.assertEqual(rv.status_code, 400)

        rv = self.client.get("/api/tokens/oauth2/bar?callback=http://localhost:3000/oauth2/bar/callback")
        self.assertEqual(rv.status_code, 404)

        rv = self.client.get("/api/tokens/oauth2/foo?callback=http://localhost:3000/oauth2/foo/callback")
        self.assertEqual(rv.status_code, 200)

        redirect_url = rv.json["data"]["redirect_url"]
        args = redirect_url.split("?")[1].split("&")

        self.assertIn("client_id=foo-id", args)
        self.assertIn("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth2%2Ffoo%2Fcallback", args)
        self.assertIn("scope=user+email", args)
        self.assertIn("response_type=code", args)

        state = None
        for arg in args:
            if arg.startswith("state="):
                state = arg.split("=")[1]
        self.assertIsNotNone(state)

        # Redirect to bad auth provider
        rv = self.client.post("/api/tokens/oauth2/bar", json={
            "code": "123", "state": state, "callback": "http://localhost:3000/oauth2/bar/callback"})
        self.assertEqual(rv.status_code, 404)

        # Redirect to good auth provider but bad state
        rv = self.client.post("/api/tokens/oauth2/foo", json={
            "code": "123", "state": "not-the-state", "callback": "http://localhost:3000/oauth2/foo/callback"})
        self.assertEqual(rv.status_code, 401)

        with mock.patch("backend.api.routes.tokens.requests.post") as requests_post:
            requests_post.return_value.status_code = 401
            rv = self.client.post("/api/tokens/oauth2/foo", json={
                "code": "123", "state": state, "callback": "http://localhost:3000/oauth2/foo/callback"})
            self.assertEqual(rv.status_code, 401)

            requests_post.assert_called_with(
                "https://foo.com/token",
                data={
                    "client_id": "foo-id",
                    "client_secret": "foo-secret",
                    "code": "123",
                    "grant_type": "authorization_code",
                    "redirect_uri": "http://localhost:3000/oauth2/foo/callback",
                },
                headers={"Accept": "application/json"},
            )

        # Auth with authorization code (failure case)
        with mock.patch("backend.api.routes.tokens.requests.post") as requests_post:
            with mock.patch("backend.api.routes.tokens.requests.get") as requests_get:
                requests_post.return_value.status_code = 200
                requests_post.return_value.json.return_value = {"access_token": "foo-token"}
                requests_get.return_value.status_code = 401
                rv = self.client.post("/api/tokens/oauth2/foo", json={
                    "code": "123", "state": state, "callback": "http://localhost:3000/oauth2/foo/callback"})
                self.assertEqual(rv.status_code, 401)

                requests_post.assert_called_with(
                    "https://foo.com/token",
                    data={
                        "client_id": "foo-id",
                        "client_secret": "foo-secret",
                        "code": "123",
                        "grant_type": "authorization_code",
                        "redirect_uri": "http://localhost:3000/oauth2/foo/callback",
                    },
                    headers={"Accept": "application/json"},
                )

        # Auth with authorization code (failure case)
        with mock.patch("backend.api.routes.tokens.requests.post") as requests_post:
            with mock.patch("backend.api.routes.tokens.requests.get") as requests_get:
                requests_post.return_value.status_code = 200
                requests_post.return_value.json.return_value = {"not_access_token": "foo-token"}
                requests_get.return_value.status_code = 200
                rv = self.client.post("/api/tokens/oauth2/foo", json={
                    "code": "123", "state": state, "callback": "http://localhost:3000/oauth2/foo/callback"})
                self.assertEqual(rv.status_code, 401)

                requests_post.assert_called_with(
                    "https://foo.com/token",
                    data={
                        "client_id": "foo-id",
                        "client_secret": "foo-secret",
                        "code": "123",
                        "grant_type": "authorization_code",
                        "redirect_uri": "http://localhost:3000/oauth2/foo/callback",
                    },
                    headers={"Accept": "application/json"},
                )

        # Auth with authorization code (success case with new user)
        with mock.patch("backend.api.routes.tokens.requests.post") as requests_post:
            with mock.patch("backend.api.routes.tokens.requests.get") as requests_get:
                requests_post.return_value.status_code = 200
                requests_post.return_value.json.return_value = {"access_token": "foo-token"}
                requests_get.return_value.status_code = 200
                requests_get.return_value.json.return_value = {"id": "user-id", "email": "foo@foo.com"}
                rv = self.client.post("/api/tokens/oauth2/foo", json={
                    "code": "123", "state": state, "callback": "http://localhost:3000/oauth2/foo/callback"})
                self.assertEqual(rv.status_code, 200)

                requests_post.assert_called_with(
                    "https://foo.com/token",
                    data={
                        "client_id": "foo-id",
                        "client_secret": "foo-secret",
                        "code": "123",
                        "grant_type": "authorization_code",
                        "redirect_uri": "http://localhost:3000/oauth2/foo/callback",
                    },
                    headers={"Accept": "application/json"},
                )

                requests_get.assert_called_with(
                    "https://foo.com/current",
                    headers={
                        "Authorization": "Bearer foo-token",
                        "Accept": "application/json",
                    },
                )

                access_token = rv.json["access_token"]

                # Test< access_token>
                rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token}"})
                self.assertEqual(rv.status_code, 200)
                self.assertEqual(rv.json["username"], "foo")

        # Auth with authorization code (success case with existing user)
        with mock.patch("backend.api.routes.tokens.requests.post") as requests_post:
            with mock.patch("backend.api.routes.tokens.requests.get") as requests_get:
                requests_post.return_value.status_code = 200
                requests_post.return_value.json.return_value = {"access_token": "foo-token"}
                requests_get.return_value.status_code = 200
                requests_get.return_value.json.return_value = {"id": "user-id", "email": "test@example.com"}
                rv = self.client.post("/api/tokens/oauth2/foo", json={
                    "code": "123", "state": state, "callback": "http://localhost:3000/oauth2/foo/callback"})
                self.assertEqual(rv.status_code, 200)

                requests_post.assert_called_with(
                    "https://foo.com/token",
                    data={
                        "client_id": "foo-id",
                        "client_secret": "foo-secret",
                        "code": "123",
                        "grant_type": "authorization_code",
                        "redirect_uri": "http://localhost:3000/oauth2/foo/callback",
                    },
                    headers={"Accept": "application/json"},
                )

                requests_get.assert_called_with(
                    "https://foo.com/current",
                    headers={
                        "Authorization": "Bearer foo-token",
                        "Accept": "application/json",
                    },
                )

                access_token = rv.json["access_token"]

                # Test <access_token>
                rv = self.client.get("/api/current_user", headers={"Authorization": f"Bearer {access_token}"})
                self.assertEqual(rv.status_code, 200)
                self.assertEqual(rv.json["username"], "test")

    def test_reset_password(self):
        with mock.patch("backend.api.routes.tokens.send_email") as send_email:
            rv = self.client.post("/api/tokens/reset_password_token", json={
                "email": "bad@example.com",
                "callback": "http://localhost:3000/reset_password",
            })
            self.assertEqual(rv.status_code, 400)

            rv = self.client.post("/api/tokens/reset_password_token", json={
                "email": "test@example.com",
                "callback": "http://localhost:3000/reset_password",
            })
            self.assertEqual(rv.status_code, 204)

        send_email.assert_called_once()
        self.assertEqual(send_email.call_args[1]["to"], f"{TEST_USER['username']}@example.com")
        self.assertEqual(send_email.call_args[1]["username"], TEST_USER["username"])
        self.assertEqual(send_email.call_args[1]["subject"], "Password Reset Request")
        self.assertEqual(send_email.call_args[1]["template"], "password_reset")
        self.assertEqual(send_email.call_args[1]["callback"], "http://localhost:3000/reset_password")

        token = send_email.call_args[1]["token"]

        rv = self.client.post("/api/tokens/reset_password", json={"token": token + "x", "new_password": "new-pass"})
        self.assertEqual(rv.status_code, 400)

        rv = self.client.post("/api/tokens/reset_password", json={"token": token, "new_password": "new-pass"})
        self.assertEqual(rv.status_code, 204)

        rv = self.client.post("/api/tokens", auth=(TEST_USER["username"], TEST_USER["password"]))
        self.assertEqual(rv.status_code, 401)

        rv = self.client.post("/api/tokens", auth=(TEST_USER["username"], "new-pass"))
        self.assertEqual(rv.status_code, 200)
