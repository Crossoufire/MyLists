import os
from datetime import datetime

from PIL import Image
from flask import current_app
from werkzeug.datastructures import FileStorage

from backend.api import db
from backend.tests.base_test import BaseTest
from backend.api.utils.functions import (save_picture, compute_level, clean_html_text, is_latin, safe_div, get, int_to_money,
                                         reorder_seas_eps, format_datetime, resize_and_save_image, format_to_download_as_csv)


class UtilsFunctionTests(BaseTest):
    def setUp(self):
        super().setUp()

        from backend.api.models.user import User

        self.image_path = os.path.join(current_app.root_path, "static/covers/default.jpg")
        self.user = User.query.first()

    def _test_save_picture(self, file: FileStorage, user_attr: str, is_profile: bool):
        file_path = "profile_pics" if is_profile else "background_pics"
        picture_fn = save_picture(file, getattr(self.user, user_attr), profile=is_profile)
        self.assertIs(os.path.isfile(os.path.join(self.app.root_path, "static", file_path, picture_fn)), True)
        return picture_fn

    def test_get_function(self):
        state = [[1, 2, [3, 4]], [5, 6], [7, 8]]
        self.assertEqual(get(state, 0, 2, 1), 4)

        state = {"a": {"b": {"c": 42}}}
        self.assertEqual(get(state, "a", "b", "c"), 42)

        state = {"a": {"b": {"c": 42}}}
        self.assertIsNone(get(state, "a", "b", "d"))

        state = {"a": {"b": {"c": 42}}}
        self.assertEqual(get(state, "a", "b", "d", default="default_value"), "default_value")

        state = {"a": {"b": {"c": 42}}}
        self.assertEqual(get(state, default="default_value"), {"a": {"b": {"c": 42}}})

        state = {}
        self.assertEqual(get(state, "a", "b", "c", default="default_value"), "default_value")

        state = {"a": {"b": {"c": 0}}}
        self.assertEqual(get(state, "a", "b", "c", default="default_value"), "default_value")

    def test_compute_level(self):
        data = [(0, 0.00000), (1, 0.04772), (2, 0.09161), (5, 0.20711), (1000, 6.58872), (100000, 70.21245), (10000000, 706.60696)]
        for lvl, expected in data:
            self.assertAlmostEqual(compute_level(lvl), expected, places=5)
        self.assertRaises(Exception, compute_level, -10)
        self.assertRaises(Exception, compute_level, "toto")

    def test_save_new_profile_image(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "image_file", True)
            os.remove(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn))
            self.assertIs(
                os.path.isfile(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn)),
                False
            )

    def test_save_new_background_image(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "background_image", False)
            os.remove(os.path.join(self.app.root_path, "static", "background_pics", picture_fn))
            self.assertIs(
                os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics", picture_fn)),
                False
            )

    def test_erase_old_user_profile(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "image_file", True)
            self.user.image_file = picture_fn
            db.session.commit()

        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "image_file", True)

            self.assertIs(
                os.path.isfile(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn)),
                True
            )

            self.assertIs(
                os.path.isfile(os.path.join(self.app.root_path, "static", "profile_pics", self.user.image_file)),
                False
            )

            os.remove(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn))

    def test_erase_old_user_background(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            self.picture_fn = self._test_save_picture(file, "background_image", False)
            self.user.background_image = self.picture_fn
            db.session.commit()

        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "background_image", False)
            self.assertIs(os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics", picture_fn)), True)
            self.assertIs(os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics", self.user.background_image)), False)
            os.remove(os.path.join(self.app.root_path, "static", "background_pics", picture_fn))

    def test_safe_div(self):
        data = [(10, 2, 5), (0, 2, 0), (-10, 2, -5), (10, 0, 0)]
        for a, b, expected in data:
            self.assertEqual(safe_div(a, b), expected)

        data = [(0, 2, 0), (5, 2, 250), (-10, 2, -500), (3, 20, 15)]
        for a, b, expected in data:
            self.assertEqual(safe_div(a, b, percentage=True), expected)

    def test_is_latin(self):
        data = [("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", True), ("1234567890áéíóúñß!@#$%^&*()", True),
                ("", True), (" ", True), ("你好", False), ("مرحبا", False), ("こんにちは", False), ("नमस्ते", False),
                ("Привет", False)]

        for text, expected in data:
            self.assertIs(is_latin(text), expected)

    def test_clean_html_text(self):
        self.assertEqual(clean_html_text(" "), " ")
        self.assertEqual(clean_html_text(""), "")
        self.assertEqual(clean_html_text("No tags here!"), "No tags here!")
        self.assertEqual(clean_html_text("<b>Bold</b> <i>Italic</i>"), "Bold Italic")
        self.assertEqual(clean_html_text("This is a test text."), "This is a test text.")
        self.assertEqual(clean_html_text("<p>This is a <b>test</b> text.</p>"), "This is a test text.")
        self.assertEqual(clean_html_text("<div><h1>Title</h1><p>Paragraph</p></div>"), "TitleParagraph")
        self.assertEqual(clean_html_text("<p>This is <b>bold</b>.<br/>New line</p>"), "This is bold.New line")

    def test_int_to_money(self):
        data = [(750, "750 $"), (1000, "1 K$"), (1500, "1 K$"), (999999, "999 K$"), (1000000, "1 M$"), (1500000, "1 M$"),
                (999999999, "999 M$"), (1000000000, "1 B$"), (1500000000, "1 B$"), (999999999999, "999 B$"),
                (1000000000000, "1000 B$")]
        for value, expected in data:
            self.assertEqual(int_to_money(value), expected)

    def test_reorder_seas_eps(self):
        """ Function returns: last episode watched, current season, total episodes watched """

        self.assertEqual(reorder_seas_eps(1, [10, 10, 10]), (1, 1, 1))
        self.assertEqual(reorder_seas_eps(10, [10, 10, 10]), (10, 1, 10))
        self.assertEqual(reorder_seas_eps(11, [10, 10, 10]), (1, 2, 11))
        self.assertEqual(reorder_seas_eps(21, [10, 10, 10]), (1, 3, 21))
        self.assertEqual(reorder_seas_eps(30, [10, 10, 10]), (10, 3, 30))

        # eps_watched > total episodes
        self.assertEqual(reorder_seas_eps(31, [10, 10, 10]), (10, 3, 30))
        self.assertEqual(reorder_seas_eps(50, [10, 10, 10]), (10, 3, 30))

        # Only one season
        self.assertEqual(reorder_seas_eps(5, [10]), (5, 1, 5))
        self.assertEqual(reorder_seas_eps(15, [10]), (10, 1, 10))

        # Zero episodes watched
        self.assertEqual(reorder_seas_eps(0, [10, 10, 10]), (0, 1, 0))

    def test_format_datetime(self):
        self.assertEqual(format_datetime("2024-08-30 12:34:56.789123"), datetime(2024, 8, 30, 12, 34, 56, 789123))
        self.assertEqual(format_datetime("2024-08-30"), datetime(2024, 8, 30))
        self.assertEqual(format_datetime("2024"), datetime(2024, 1, 1))
        self.assertEqual(format_datetime("1698685496"), datetime.fromtimestamp(1698685496))
        self.assertIsNone(format_datetime("2024-13-30"))
        self.assertIsNone(format_datetime("not a date"))
        self.assertIsNone(format_datetime("abc123"))

    def test_resize_and_save_image(self):
        temp_input_path = "temp_input_image.jpg"
        temp_output_path = "temp_output_image.jpg"
        size = (300, 450)

        img = Image.new("RGB", (600, 800), color="red")
        img.save(temp_input_path)

        resize_and_save_image(temp_input_path, temp_output_path, size)
        self.assertTrue(os.path.exists(temp_output_path))

        with Image.open(temp_output_path) as resized_img:
            self.assertEqual(resized_img.size, size)

        os.remove(temp_input_path)
        os.remove(temp_output_path)

    def test_format_to_download_as_csv(self):
        # "Normal case"
        media_dict = {
            "title": "Movie Title",
            "rating": {"value": 8.5, "type": "score"},
            "media_cover": "default.jpg",
            "all_status": ["Watching", "Completed"],
            "all_platforms": ["Netflix", "Hulu"],
            "year": 2023,
        }
        expected_output = {
            "title": "Movie Title",
            "rating_value": 8.5,
            "rating_type": "score",
            "year": 2023,
        }
        self.assertEqual(format_to_download_as_csv(media_dict), expected_output)

        # Empty media_dict
        media_dict = {}
        expected_output = {}
        self.assertEqual(format_to_download_as_csv(media_dict), expected_output)

        # Media_dict only attributes to remove
        media_dict = {
            "media_cover": "default.jpg",
            "all_status": ["Watching", "Completed"],
            "all_platforms": ["Xbox", "Playstation"],
            "eps_per_season": [10, 10, 30],
        }
        expected_output = {}
        self.assertEqual(format_to_download_as_csv(media_dict), expected_output)
