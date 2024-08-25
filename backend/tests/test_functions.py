import os
from backend.api import db
from werkzeug.exceptions import BadRequest
from backend.tests.base_test import BaseTest
from werkzeug.datastructures import FileStorage
from backend.api.utils.functions import save_picture, compute_level, display_time, clean_html_text, is_latin, safe_div


class UtilsFunctionTests(BaseTest):
    def setUp(self):
        super().setUp()

        from backend.api.models.user import User

        current_dir = os.path.dirname(os.path.abspath(__file__))

        self.image_path = os.path.join(current_dir, "images/anonymous.jpg")
        self.bad_image_path = os.path.join(current_dir, "images/anonymous_scrambled.jpg")
        self.user = User.query.first()

    def _test_save_picture(self, file: FileStorage, user_attr: str, is_profile: bool):
        file_path = "profile_pics" if is_profile else "background_pics"
        picture_fn = save_picture(file, getattr(self.user, user_attr), profile=is_profile)
        self.assertIs(os.path.isfile(os.path.join(self.app.root_path, "static", file_path, picture_fn)), True)
        return picture_fn

    def test_get_level(self):
        self.assertAlmostEqual(compute_level(0), 0.00000, places=5)
        self.assertAlmostEqual(compute_level(1), 0.04772, places=5)
        self.assertAlmostEqual(compute_level(2), 0.09161, places=5)
        self.assertAlmostEqual(compute_level(5), 0.20711, places=5)
        self.assertAlmostEqual(compute_level(1000), 6.58872, places=5)
        self.assertAlmostEqual(compute_level(100000), 70.21245, places=5)
        self.assertAlmostEqual(compute_level(10000000), 706.60696, places=5)
        self.assertRaises(Exception, compute_level, -10)
        self.assertRaises(Exception, compute_level, "toto")

    def test_display_time(self):
        self.assertEqual(display_time(0), "0 hours")
        self.assertEqual(display_time(60), "1 hours")
        self.assertEqual(display_time(1440), "1 days")
        self.assertEqual(display_time(43800), "30 days, and 10 hours")
        self.assertEqual(display_time(525600), "1 years")
        self.assertEqual(display_time(568800), "1 years, 30 days")
        self.assertEqual(display_time(5256000), "9 years, 11 months, 29 days")
        self.assertEqual(display_time(1568768765), "2982 years, 8 months, 25 days, and 18 hours")
        self.assertEqual(display_time(-466795), "1 months, 9 days, and 20 hours")
        self.assertRaises(TypeError, display_time, "toto")

    def test_clean_html_text(self):
        self.assertEqual(clean_html_text(" "), " ")
        self.assertEqual(clean_html_text(""), "")
        self.assertEqual(clean_html_text("No tags here!"), "No tags here!")
        self.assertEqual(clean_html_text("<b>Bold</b> <i>Italic</i>"), "Bold Italic")
        self.assertEqual(clean_html_text("This is a test text."), "This is a test text.")
        self.assertEqual(clean_html_text("<p>This is a <b>test</b> text.</p>"), "This is a test text.")
        self.assertEqual(clean_html_text("<div><h1>Title</h1><p>Paragraph</p></div>"), "TitleParagraph")
        self.assertEqual(clean_html_text("<p>This is <b>bold</b>.<br/>New line</p>"), "This is bold.New line")

    def test_is_latin(self):
        self.assertIs(is_latin("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"), True)
        self.assertIs(is_latin("1234567890áéíóúñß!@#$%^&*()"), True)
        self.assertIs(is_latin(""), True)
        self.assertIs(is_latin(" "), True)
        self.assertIs(is_latin("你好"), False)
        self.assertIs(is_latin("مرحبا"), False)
        self.assertIs(is_latin("こんにちは"), False)
        self.assertIs(is_latin("नमस्ते"), False)
        self.assertIs(is_latin("Привет"), False)

    # noinspection PyTypeChecker
    def test_safe_div(self):
        self.assertEqual(safe_div(10, 2), 5)
        self.assertEqual(safe_div(0, 2), 0)
        self.assertEqual(safe_div(-10, 2), -5)
        self.assertEqual(safe_div(10, 0), 0)
        self.assertEqual(safe_div("3", 2), 0)
        self.assertEqual(safe_div(6, "7"), 0)
        self.assertEqual(safe_div("41859", "5"), 0)
        self.assertEqual(safe_div("abc", "def"), 0)

        self.assertEqual(safe_div(0, 2, percentage=True), 0)
        self.assertEqual(safe_div(5, 2, percentage=True), 250)
        self.assertEqual(safe_div(-10, 2, percentage=True), -500)
        self.assertEqual(safe_div(3, 20, percentage=True), 15)

    def test_save_new_profile_image(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "image_file", True)
            os.remove(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn))
            self.assertIs(
                os.path.isfile(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn)),
                False
            )

    def test_bad_new_profile_image(self):
        with open(self.bad_image_path, "rb") as fp:
            file = FileStorage(fp)
            self.assertRaises(BadRequest, self._test_save_picture, file, "image_file", True)

    def test_save_new_background_image(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "background_image", False)
            os.remove(os.path.join(self.app.root_path, "static", "background_pics", picture_fn))
            self.assertIs(
                os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics", picture_fn)),
                False
            )

    def test_bad_new_background_image(self):
        with open(self.bad_image_path, "rb") as fp:
            file = FileStorage(fp)
            self.assertRaises(BadRequest, self._test_save_picture, file, "background_image", False)

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

            self.assertIs(
                os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics", picture_fn)),
                True
            )

            self.assertIs(
                os.path.isfile(os.path.join(
                    self.app.root_path,
                    "static", "background_pics", self.user.background_image)
                ),
                False
            )

            os.remove(os.path.join(self.app.root_path, "static", "background_pics", picture_fn))
