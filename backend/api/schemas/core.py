from marshmallow import ValidationError
from webargs.flaskparser import FlaskParser as BaseFlaskParser
from backend.api import ma


class ApiValidationError(Exception):
    def __init__(self, status_code, messages):
        self.status_code = status_code
        self.messages = messages


class EnumField(ma.Field):
    def __init__(self, enum_class, *args, **kwargs):
        self.enum_class = enum_class
        super().__init__(*args, **kwargs)

    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value.value
        raise ValidationError(f"Invalid value type for Enum {self.enum_class.__name__}: {value}")

    def _deserialize(self, value, attr, data, **kwargs):
        try:
            return self.enum_class(value)
        except ValueError:
            raise ValidationError(f"Invalid value: {value} for Enum {self.enum_class.__name__}")


class SplitStringList(ma.List):
    def _deserialize(self, value, attr, data, **kwargs):
        if isinstance(value, list) and len(value) == 1 and isinstance(value[0], str):
            value = value[0].split(",")
        return super()._deserialize(value, attr, data, **kwargs)


class FlaskParser(BaseFlaskParser):
    USE_ARGS_POSITIONAL = False
    DEFAULT_VALIDATION_STATUS = 400

    def load_form(self, req, schema):
        return {**self.load_files(req, schema), **super().load_form(req, schema)}

    def handle_error(self, error, req, schema, *, error_status_code, error_headers):
        raise ApiValidationError(error_status_code or self.DEFAULT_VALIDATION_STATUS, error.messages)


class EmptySchema(ma.Schema):
    pass
