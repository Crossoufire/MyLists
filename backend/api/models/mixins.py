from typing import Dict


class UpdateMixin:
    def update(self, data: Dict):
        for attr, value in data.items():
            setattr(self, attr, value)
        return self
