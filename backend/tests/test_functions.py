import os
from backend.api import db
from werkzeug.exceptions import BadRequest
from backend.tests.base_test import BaseTest
from werkzeug.datastructures import FileStorage
from backend.api.utils.enums import MediaType
from backend.api.utils.functions import (save_picture, get_class_registry, get_level, display_time, clean_html_text,
                                         is_latin, safe_div, change_air_format, get_media_level)


class UtilsFunctionTests(BaseTest):
    def setUp(self):
        super().setUp()

        from backend.api.models.user_models import User

        self.image_path = "backend/tests/images/anonymous.jpg"
        self.bad_image_path = "backend/tests/images/anonymous_scrambled.jpg"
        self.user = User.query.first()

    def _test_save_picture(self, file: FileStorage, user_attr: str, is_profile: bool):
        file_path = "profile_pics" if is_profile else "background_pics"
        picture_fn = save_picture(file, getattr(self.user, user_attr), profile=is_profile)
        assert os.path.isfile(os.path.join(self.app.root_path, "static", file_path, picture_fn)) is True
        return picture_fn

    def test_get_class_registry(self):
        class DummyModel:
            pass

        class RegistryMock:
            _decl_class_registry = {"DummyModel": DummyModel}

        class RegistryMock2:
            class DummyClass:
                _class_registry = {"DummyModel": DummyModel}

            _sa_registry = DummyClass()

        registry = get_class_registry(RegistryMock)
        assert registry == {"DummyModel": DummyModel}

        registry = get_class_registry(RegistryMock2)
        assert registry == {"DummyModel": DummyModel}

        self.assertRaises(AttributeError, get_class_registry, DummyModel)

    def test_get_level(self):
        self.assertAlmostEqual(get_level(0), 0.00000, places=5)
        self.assertAlmostEqual(get_level(1), 0.04772, places=5)
        self.assertAlmostEqual(get_level(2), 0.09161, places=5)
        self.assertAlmostEqual(get_level(5), 0.20711, places=5)
        self.assertAlmostEqual(get_level(1000), 6.58872, places=5)
        self.assertAlmostEqual(get_level(100000), 70.21245, places=5)
        self.assertAlmostEqual(get_level(10000000), 706.60696, places=5)
        self.assertRaises(Exception, get_level, -10)
        self.assertRaises(Exception, get_level, "toto")

    def test_get_media_level(self):
        media_lvl = get_media_level(self.user, MediaType.SERIES)
        assert media_lvl == 0

        self.user.time_spent_series = 12675
        db.session.commit()

        media_lvl = get_media_level(self.user, MediaType.SERIES)
        assert media_lvl == 24

        self.assertRaises(AttributeError, get_media_level, self.user, "toto")
        self.assertRaises(AttributeError, get_media_level, "toto", MediaType.SERIES)

    def test_display_time(self):
        assert display_time(0) == "0 hours"
        assert display_time(60) == "1 hours"
        assert display_time(1440) == "1 days"
        assert display_time(43800) == "30 days, and 10 hours"
        assert display_time(525600) == "1 years"
        assert display_time(568800) == "1 years, 30 days"
        assert display_time(5256000) == "9 years, 11 months, 29 days"
        assert display_time(1568768765) == "2982 years, 8 months, 25 days, and 18 hours"
        assert display_time(-466795) == "1 months, 9 days, and 20 hours"
        self.assertRaises(TypeError, display_time, "toto")

    @staticmethod
    def test_clean_html_text():
        assert clean_html_text(" ") == " "
        assert clean_html_text("") == "Unknown"
        assert clean_html_text("No tags here!") == "No tags here!"
        assert clean_html_text("<b>Bold</b> <i>Italic</i>") == "Bold Italic"
        assert clean_html_text("This is a test text.") == "This is a test text."
        assert clean_html_text("<p>This is a <b>test</b> text.</p>") == "This is a test text."
        assert clean_html_text("<div><h1>Title</h1><p>Paragraph</p></div>") == "TitleParagraph"
        assert clean_html_text("<p>This is <b>bold</b>.<br/>New line</p>") == "This is bold.New line"

    @staticmethod
    def test_is_latin():
        assert is_latin("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") is True
        assert is_latin("1234567890áéíóúñß!@#$%^&*()") is True
        assert is_latin("") is True
        assert is_latin(" ") is True

        assert is_latin("你好") is False
        assert is_latin("مرحبا") is False
        assert is_latin("こんにちは") is False
        assert is_latin("नमस्ते") is False
        assert is_latin("Привет") is False

    # noinspection PyTypeChecker
    @staticmethod
    def test_safe_div():
        assert safe_div(10, 2) == 5
        assert safe_div(0, 2) == 0
        assert safe_div(-10, 2) == -5
        assert safe_div(10, 0) == 0
        assert safe_div("3", 2) == 0
        assert safe_div(6, "7") == 0
        assert safe_div("41859", "5") == 0
        assert safe_div("abc", "def") == 0

        assert safe_div(0, 2, percentage=True) == 0
        assert safe_div(5, 2, percentage=True) == 250
        assert safe_div(-10, 2, percentage=True) == -500
        assert safe_div(3, 20, percentage=True) == 15

    @staticmethod
    def test_change_air_format():
        assert change_air_format("2023-05-20", tv=True) == "20 May 2023"
        assert change_air_format("2023/05/20", tv=True) == "N/A"

        assert change_air_format("1728128000", games=True) == "05 Oct 2024"
        assert change_air_format("abcd", games=True) == "N/A"

        assert change_air_format("Published 2008 by XYZ", books=True) == "2008"
        assert change_air_format("Random text", books=True) == "N/A"

        assert change_air_format("2023-05-20") == "20 May 2023"
        assert change_air_format("2023/05/20") == "N/A"
        assert change_air_format("Random text", tv=True, games=True, books=True) == "N/A"

    def test_save_new_profile_image(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "image_file", True)
            os.remove(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn))
            assert os.path.isfile(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn)) is False

    def test_bad_new_profile_image(self):
        with open(self.bad_image_path, "rb") as fp:
            file = FileStorage(fp)
            self.assertRaises(BadRequest, self._test_save_picture, file, "image_file", True)

    def test_save_new_background_image(self):
        with open(self.image_path, "rb") as fp:
            file = FileStorage(fp)
            picture_fn = self._test_save_picture(file, "background_image", False)
            os.remove(os.path.join(self.app.root_path, "static", "background_pics", picture_fn))
            assert os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics", picture_fn)) is False

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
            assert os.path.isfile(os.path.join(self.app.root_path, "static", "profile_pics", picture_fn)) is True
            assert os.path.isfile(
                os.path.join(self.app.root_path, "static", "profile_pics", self.user.image_file)) is False
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
            assert os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics", picture_fn)) is True
            assert os.path.isfile(os.path.join(self.app.root_path, "static", "background_pics",
                                               self.user.background_image)) is False
            os.remove(os.path.join(self.app.root_path, "static", "background_pics", picture_fn))
