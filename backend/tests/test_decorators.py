from typing import Any, Dict
from backend.api import db
from backend.api.utils.decorators import validate_media_type, validate_json_data
from backend.api.utils.enums import MediaType, ModelTypes
from backend.tests.base_test import BaseTest


class DecoratorsTests(BaseTest):
    def test_valid_media_type(self):
        @self.app.route("/test/<media_type>", methods=["GET"])
        @validate_media_type
        def test_function(media_type: MediaType):
            return {"media_type": media_type.value}, 200

        # Bad - No <media_type>
        rv = self.client.get("/test/")
        self.assertEqual(rv.status_code, 404)

        # Bad - <media_type> not in MediaType Enum
        rv = self.client.get("/test/toto")
        self.assertEqual(rv.status_code, 400)

        # Good - <media_type> in MediaType Enum
        rv = self.client.get("/test/series")
        self.assertEqual(rv.status_code, 200)
        self.assertEqual(rv.json["media_type"], "series")

    def test_validate_json_data_no_payload(self):
        @self.app.route("/test", methods=["POST"])
        @validate_json_data()
        def test_function(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
            data = {
                "media_type": media_type.value,
                "media_id": media_id,
                "payload": payload,
            }

            if models:
                data.update({"models": True})

            return {"data": data}, 200

        # Bad JSON - No JSON
        rv = self.client.post("/test")
        self.assertEqual(rv.status_code, 400)

        # Bad JSON - Not complete
        rv = self.client.post("/test", json={"media_type": "series"})
        self.assertEqual(rv.status_code, 400)

        # Bad JSON - Bad <media_id> (should be cast able to <int>)
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "toto"})
        self.assertEqual(rv.status_code, 400)

        # Bad JSON - Bad <media_type> (should be in <MediaType> Enum)
        rv = self.client.post("/test", json={"media_type": "toto", "media_id": "1"})
        self.assertEqual(rv.status_code, 400)

        # Good JSON - no payload
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1"})
        self.assertEqual(rv.status_code, 200)
        self.assertIs(rv.json["data"]["models"], True)

    def test_validate_json_data_with_payload_bool(self):
        @self.app.route("/test", methods=["POST"])
        @validate_json_data(bool)
        def test_function(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
            data = {
                "media_type": media_type.value,
                "media_id": media_id,
                "payload": payload,
            }

            if models:
                data.update({"models": True})

            return {"data": data}, 200

        # Bad JSON - Payload should be <bool>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1"})
        self.assertEqual(rv.status_code, 400)

        # Bad JSON - Payload should be specifically <bool>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1", "payload": "toto"})
        self.assertEqual(rv.status_code, 400)

        # Bad JSON - Payload should be specifically <bool>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1", "payload": 1})
        self.assertEqual(rv.status_code, 400)

        # Good JSON
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1", "payload": True})
        self.assertEqual(rv.status_code, 200)

    def test_validate_json_data_with_payload_str(self):
        @self.app.route("/test", methods=["POST"])
        @validate_json_data(str)
        def test_function(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
            data = {
                "media_type": media_type.value,
                "media_id": media_id,
                "payload": payload,
            }

            if models:
                data.update({"models": True})

            return {"data": data}, 200

        # Bad JSON - Payload should be <str>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1"})
        self.assertEqual(rv.status_code, 400)

        # Good JSON - Payload should be cast to <str>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1", "payload": 145})
        self.assertEqual(rv.status_code, 200)
        self.assertIs(type(rv.json["data"]["payload"]), str)

    def test_validate_json_data_with_payload_int(self):
        @self.app.route("/test", methods=["POST"])
        @validate_json_data(int)
        def test_function(media_type: MediaType, media_id: int, payload: Any, models: Dict[ModelTypes, db.Model]):
            data = {
                "media_type": media_type.value,
                "media_id": media_id,
                "payload": payload,
            }

            if models:
                data.update({"models": True})

            return {"data": data}, 200

        # Bad JSON - Payload should be <int>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1"})
        self.assertEqual(rv.status_code, 400)

        # Good JSON - Payload should be cast to <int>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1", "payload": "145"})
        self.assertEqual(rv.status_code, 200)
        self.assertIs(type(rv.json["data"]["payload"]), int)

        # Bad JSON - Payload is not cast able to <int>
        rv = self.client.post("/test", json={"media_type": "series", "media_id": "1", "payload": "toto"})
        self.assertEqual(rv.status_code, 400)
