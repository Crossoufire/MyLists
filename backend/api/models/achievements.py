from typing import Dict, List

from sqlalchemy import case, Case, func

from backend.api import db
from backend.api.utils.enums import AchievementDifficulty


class AchievementTier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievement.id"), nullable=False)
    difficulty = db.Column(db.Enum(AchievementDifficulty), nullable=False)
    criteria = db.Column(db.JSON, nullable=False)
    rarity = db.Column(db.Float, default=0.0)

    # --- relationships -----------------------------------------------------------
    achievement = db.relationship("Achievement", back_populates="tiers", lazy="select")
    user_achievements = db.relationship("UserAchievement", back_populates="tier", lazy="select")

    def to_dict(self) -> Dict:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


def get_difficulty_case() -> Case:
    # noinspection PyTypeChecker
    return case(
        (AchievementTier.difficulty == AchievementDifficulty.BRONZE, 1),
        (AchievementTier.difficulty == AchievementDifficulty.SILVER, 2),
        (AchievementTier.difficulty == AchievementDifficulty.GOLD, 3),
        (AchievementTier.difficulty == AchievementDifficulty.PLATINUM, 4)
    )


class Achievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    code_name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String, nullable=False)
    media_type = db.Column(db.String)

    # --- relationships -----------------------------------------------------------
    users = db.relationship("UserAchievement", back_populates="achievement", order_by=get_difficulty_case(), lazy="select",
                            cascade="all, delete-orphan")
    tiers = db.relationship("AchievementTier", back_populates="achievement", order_by=get_difficulty_case(), lazy="joined",
                            cascade="all, delete-orphan")

    def to_dict(self) -> Dict:
        ach_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        ach_dict["tiers"] = [tier.to_dict() for tier in self.tiers]
        return ach_dict


class UserAchievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievement.id"))
    tier_id = db.Column(db.Integer, db.ForeignKey("achievement_tier.id"))
    progress = db.Column(db.Float, default=0.0)
    count = db.Column(db.Float, default=0.0)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    last_calculated_at = db.Column(db.DateTime)

    # --- Relationships -----------------------------------------------------------
    user = db.relationship("User", back_populates="achievements", lazy="select")
    achievement = db.relationship("Achievement", back_populates="users", lazy="select")
    tier = db.relationship("AchievementTier", back_populates="user_achievements", lazy="select")

    def to_dict(self) -> Dict:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    @classmethod
    def get_highest_tier_counts(cls, user_id: int) -> List[Dict]:
        """ Return the highest tier achievement count for each difficulty """

        tier_order = get_difficulty_case()

        subq = (
            db.session.query(cls.achievement_id, func.max(tier_order).label("max_tier_order"))
            .join(AchievementTier, cls.tier_id == AchievementTier.id)
            .filter(cls.user_id == user_id, cls.completed == True)
            .group_by(cls.achievement_id)
            .subquery()
        )

        result = (
            db.session.query(AchievementTier.difficulty, func.count().label("count"))
            .join(subq, (AchievementTier.achievement_id == subq.c.achievement_id) & (tier_order == subq.c.max_tier_order))
            .group_by(AchievementTier.difficulty)
            .order_by(tier_order).all()
        )

        return [dict(difficulty=d.value, count=c) for d, c in result]
