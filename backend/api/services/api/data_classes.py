from pathlib import Path
from typing import Optional, List, Dict
from dataclasses import dataclass

from backend.api import MediaType


@dataclass
class ApiParams:
    media_type: MediaType
    local_cover_path: Path
    results_per_page: int = 20
    api_key: Optional[str] = None
    main_url: Optional[str] = None
    secret_id: Optional[str] = None
    client_id: Optional[str] = None
    poster_base_url: Optional[str] = None


@dataclass
class ParsedSearchItem:
    name: str
    api_id: int
    image_cover: str
    media_type: MediaType
    date: Optional[str] = None


@dataclass
class ParsedSearch:
    items: List[ParsedSearchItem]
    total: int
    pages: int


@dataclass
class ApiSearchResult:
    total: int
    results: List[Dict]


@dataclass(kw_only=True)
class BooksParsedSearchItem(ParsedSearchItem):
    author: str
