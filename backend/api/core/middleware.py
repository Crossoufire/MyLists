import logging
import time
from werkzeug import Request


def setup_middleware_logger():
    logger = logging.getLogger("middleware")
    logger.setLevel(logging.INFO)

    fh = logging.FileHandler("middleware.log")
    fh.setLevel(logging.INFO)
    logger.addHandler(fh)

    return logger


middleware_logger = setup_middleware_logger()


class LoggingMiddleware:
    def __init__(self, app):
        self.app = app
        self.logger = middleware_logger

    def __call__(self, environ, start_response):
        rq_start_time = time.time()
        req = Request(environ)

        def custom_start_response(status, headers, exc_info=None):
            self.logger.info(f"*** [{req.method}] '{req.path}': {(time.time() - rq_start_time) * 1000:.1f} ms")
            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)