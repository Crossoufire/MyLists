from flask import abort
from werkzeug.routing import BaseConverter
from backend.api.utils.enums import MediaType, JobType


class MediaTypeConverter(BaseConverter):
    def to_python(self, value: str) -> MediaType:
        try:
            return MediaType(value)
        except ValueError:
            abort(400, "Invalid media type")

    def to_url(self, value: MediaType) -> str:
        return value.value


class JobTypeConverter(BaseConverter):
    def to_python(self, value: str) -> JobType:
        try:
            return JobType(value)
        except ValueError:
            abort(400, "Invalid job type")

    def to_url(self, value: JobType) -> str:
        return value.value
