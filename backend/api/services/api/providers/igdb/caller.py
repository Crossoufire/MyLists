import json
from typing import Optional, Dict

from backend.api.core.errors import log_error
from backend.api.services.api.data_classes import ApiParams, ApiSearchResult
from backend.api.services.api.providers.base.base_caller import BaseApiCaller


class GamesApiCaller(BaseApiCaller):
    def __init__(self, params: ApiParams):
        super().__init__(params)

        self.headers = {"Client-ID": self.params.client_id, "Authorization": f"Bearer {self.params.api_key}"}

    def search(self, query: str, page: int = 1) -> ApiSearchResult:
        data = (
            f'fields id, name, cover.image_id, first_release_date; limit 10; '
            f'offset {(page - 1) * self.params.results_per_page}; search "{query}";'
        )

        response = self.call(self.params.main_url, method="post", data=data, headers=self.headers)

        return ApiSearchResult(
            results=json.loads(response.text),
            total=int(response.headers.get("X-Count", 0))
        )

    def details(self, api_id: int | str) -> Dict:
        body = (
            f"fields name, cover.image_id, game_engines.name, game_modes.name, platforms.name, genres.name, "
            f"player_perspectives.name, total_rating, total_rating_count, first_release_date, "
            f"involved_companies.company.name, involved_companies.developer, involved_companies.publisher, "
            f"summary, themes.name, url; where id={api_id};"
        )
        response = self.call(self.params.main_url, "post", data=body, headers=self.headers)
        return json.loads(response.text)[0]

    def trending(self) -> Dict:
        raise NotImplementedError("The Games does not have trending data")

    def update_token(self) -> Optional[str]:
        """ Update the IGDB API Token. Backend needs to restart to update the <env> variable. """

        super().update_token()

        try:
            response = self.call(
                method="post",
                url=f"https://id.twitch.tv/oauth2/token?client_id={self.params.client_id}&"
                    f"client_secret={self.params.secret_id}&grant_type=client_credentials",
            )
            data = json.loads(response.text)
            new_igdb_token = data["access_token"]

            return new_igdb_token
        except Exception as e:
            log_error(e)

    def changed_api_ids(self):
        raise NotImplementedError("The Games does not used the API to fetch the changed API ids")
