from sqlalchemy import or_


class SearchableMixin:
    @classmethod
    def search(cls, query, search_term: str):
        search_columns = getattr(cls, "__searchable__", [])

        filters = []
        for column in search_columns:
            filters.append(getattr(cls, column).ilike(f"%{search_term}%"))

        return query.filter(or_(*filters))
