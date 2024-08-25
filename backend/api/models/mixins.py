from typing import Dict
from sqlalchemy import or_, inspect


class SearchableMixin:
    @classmethod
    def search(cls, query, search_term: str):
        search_columns = getattr(cls, "__searchable__", [])

        filters = []
        for column in search_columns:
            filters.append(getattr(cls, column).ilike(f"%{search_term}%"))

        return query.filter(or_(*filters))


class UpdateMixin:
    def update(self, data: Dict):
        for attr, value in data.items():
            setattr(self, attr, value)
        return self


class SerializerMixin:
    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
