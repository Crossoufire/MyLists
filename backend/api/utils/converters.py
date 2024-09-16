from flask import abort, request
from werkzeug.routing import BaseConverter

from backend.api.utils.enums import MediaType, JobType


class MediaTypeConverter(BaseConverter):
    def to_python(self, value: str) -> str | MediaType:
        # Skip validation for OPTIONS requests
        if request.method == "OPTIONS":
            return value

        try:
            return MediaType(value)
        except:
            return abort(404, description="MediaType not found")

    def to_url(self, value: MediaType) -> str:
        return value.value


class JobTypeConverter(BaseConverter):
    def to_python(self, value: str) -> str | JobType:
        # Skip validation for OPTIONS requests
        if request.method == "OPTIONS":
            return value

        try:
            return JobType(value)
        except ValueError:
            return abort(404, description="JobType not found")

    def to_url(self, value: JobType) -> str:
        return value.value
