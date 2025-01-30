from typing import Dict, Optional

from howlongtobeatpy import HowLongToBeat

from backend.api.services.api.data_classes import ApiParams
from backend.api.services.api.providers.base.base_extra import BaseApiExtra


class HltbApiExtra(BaseApiExtra):
    def __init__(self, params: Optional[ApiParams] = None):
        super().__init__(params)

    def execute(self, name: str) -> Dict:
        """ Fetch the games list from a name and return the main, extra and completionist times """

        games_list = HowLongToBeat().search(name.lower(), similarity_case_sensitive=False)

        main, extra, completionist = None, None, None
        if games_list:
            game = max(games_list, key=lambda x: x.similarity)
            main = game.main_story
            extra = game.main_extra
            completionist = game.completionist

        return dict(main=main, extra=extra, completionist=completionist)
