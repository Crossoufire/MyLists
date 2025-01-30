from typing import Dict, List

from flask import abort

from backend.api.models import User
from backend.api import MediaType, db
from backend.api.utils.enums import ModelTypes
from backend.api.managers.ModelsManager import ModelsManager


class MediaListSearchFilters:
    """ Return one search filter from: actors, authors, director, creator, companies, platforms, networks """

    def __init__(self, user: User, media_type: MediaType, args: Dict):
        self.user = user
        self.args = args
        self.media_type = media_type
        self._initialize_media_models()

        self.filters_map = {
            "actors": self._actors_filters,
            "authors": self._authors_filters,
            "companies": self._companies_filters,
            "creators": self._creators_filters,
            "networks": self._networks_filters,
            "directors": self._directors_filters,
            "publishers": self._publishers_filters,
        }

    def _initialize_media_models(self):
        media_models = ModelsManager.get_dict_models(self.media_type, "all")
        self.media = media_models[ModelTypes.MEDIA]
        self.media_list = media_models[ModelTypes.LIST]
        self.media_actors = media_models.get(ModelTypes.ACTORS)
        self.media_authors = media_models.get(ModelTypes.AUTHORS)
        self.media_network = media_models.get(ModelTypes.NETWORK)
        self.media_platform = media_models.get(ModelTypes.PLATFORMS)
        self.media_companies = media_models.get(ModelTypes.COMPANIES)

    def _actors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_actors.name).join(self.media.actors)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_actors.name).filter(self.media_actors.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [actor[0] for actor in query]

    def _publishers_filters(self) -> List[str]:
        query = (
            db.session.query(self.media.publishers).join(self.media_list)
            .filter(self.media_list.user_id == self.user.id)
            .group_by(self.media.publishers).filter(self.media.publishers.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [pub[0] for pub in query]

    def _authors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_authors.name).join(self.media.authors)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_authors.name).filter(self.media_authors.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [author[0] for author in query]

    def _directors_filters(self) -> List[str]:
        query = (
            db.session.query(self.media.director_name).join(self.media_list)
            .filter(self.media_list.user_id == self.user.id)
            .group_by(self.media.director_name).filter(self.media.director_name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [director[0] for director in query]

    def _companies_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_companies.name).join(self.media.companies)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_companies.name).filter(self.media_companies.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [company[0] for company in query]

    def _creators_filters(self) -> List[str]:
        query = (
            db.session.query(self.media.created_by).join(self.media_list)
            .filter(self.media_list.user_id == self.user.id)
            .group_by(self.media.created_by).filter(self.media.created_by.ilike(f"%{self.args['q']}%"))
            .all()
        )

        creators = []
        for (creator_string,) in query:
            creators.extend(creator.strip() for creator in creator_string.split(",") if creator.strip())

        return creators

    def _networks_filters(self) -> List[str]:
        query = (
            db.session.query(self.media_network.name).join(self.media.networks)
            .join(self.media_list).filter(self.media_list.user_id == self.user.id)
            .group_by(self.media_network.name).filter(self.media_network.name.ilike(f"%{self.args['q']}%"))
            .all()
        )
        return [network[0] for network in query]

    def return_filters(self) -> List[str]:
        try:
            return self.filters_map[self.args["job"]]()
        except:
            return abort(400, description="Filter not recognized")
