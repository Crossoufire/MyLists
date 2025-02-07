import json
from typing import Dict, Optional, List

from backend.api import limiter
from backend.api.core.errors import log_error
from backend.api.services.api.data_classes import ApiParams
from backend.api.utils.functions import global_limiter, get
from backend.api.services.api.providers.base.base_extra import BaseApiExtra


class JikanApiExtra(BaseApiExtra):
    def __init__(self, params: Optional[ApiParams] = None):
        super().__init__(params)

    @limiter.limit("3/second", key_func=global_limiter)
    def execute(self, name: str) -> List[Dict]:
        """ IMPORTANT: This method cannot be called if not in a flask request context!!! (flask-limiter).
        Used to get more accurate genres for anime/manga and return the genres as a list of dict """

        response = self.call(f"https://api.jikan.moe/v4/anime?q={name}")
        anime_search = json.loads(response.text)

        try:
            anime_genres = get(anime_search, "data", 0, "genres", default=[])
            anime_demographic = get(anime_search, "data", 0, "demographics", default=[])
            fusion_list = anime_genres + anime_demographic
            return [{"name": item["name"]} for item in fusion_list][:5]
        except Exception as e:
            log_error(e)
            return []
