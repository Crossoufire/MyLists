from __future__ import annotations

import random
from operator import and_
from typing import Dict, List

from sqlalchemy import case, Case, func
from sqlalchemy.orm import contains_eager

from backend.api import db
from backend.api.utils.enums import AchievementDifficulty, MediaType


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
    value = db.Column(db.String, nullable=True)
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

    @classmethod
    def get_all_achievements_with_user(cls, user_id: int) -> List[Dict]:
        """ Return all the achievements as well as user achievement if they exist as a list of dict """

        achievements = (
            cls.query.outerjoin(
                UserAchievement, and_(UserAchievement.user_id == user_id, UserAchievement.achievement_id == Achievement.id)
            ).options(contains_eager(cls.users)).all()
        )

        result = []
        for achievement in achievements:
            ach_dict = {
                **achievement.to_dict(),
                "user_data": [user_ach.to_dict() for user_ach in achievement.users],
            }
            result.append(ach_dict)

        return result

    @classmethod
    def get_user_achievements(cls, user_id: int, limit: int = 6) -> List[Dict]:
        """ Get only `limit` randomized achievements for the user (profile page) """

        achievements = (
            cls.query
            .join(UserAchievement, and_(UserAchievement.user_id == user_id, UserAchievement.achievement_id == Achievement.id))
            .options(contains_eager(cls.users)).all()
        )
        random.shuffle(achievements)

        details = []
        for achievement in achievements[:limit]:
            highest_diff_completed = None
            for i, user_ach in enumerate(reversed(achievement.users)):
                if user_ach.completed:
                    highest_diff_completed = achievement.tiers[len(achievement.users) - i - 1].difficulty
                    break

            details.append(dict(
                name=achievement.name,
                description=achievement.description,
                difficulty=highest_diff_completed,
            ))

        return details


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

    # noinspection PyTypeChecker
    @classmethod
    def get_full_summary(cls, user_id: int) -> Dict:
        """ Return a summary dict counting each media type and difficulty + total """

        tier_order = get_difficulty_case()

        subq = (
            db.session.query(Achievement.media_type, cls.achievement_id, func.max(tier_order).label("max_tier_order"))
            .join(AchievementTier, cls.tier_id == AchievementTier.id)
            .join(Achievement, cls.achievement_id == Achievement.id)
            .filter(cls.user_id == user_id, cls.completed == True)
            .group_by(Achievement.media_type, cls.achievement_id)
            .subquery()
        )

        completed_result = (
            db.session.query(subq.c.media_type, AchievementTier.difficulty, func.count().label("count"))
            .join(subq, (AchievementTier.achievement_id == subq.c.achievement_id) & (tier_order == subq.c.max_tier_order))
            .group_by(subq.c.media_type, AchievementTier.difficulty)
            .order_by(subq.c.media_type, tier_order).all()
        )

        total_achievements = (
            db.session.query(Achievement.media_type, func.count().label("total"))
            .group_by(Achievement.media_type).all()
        )

        results = {media_type: [] for media_type in MediaType}
        results.update({"all": []})
        completed_counts = {(res.media_type, res.difficulty): res.count for res in completed_result}

        grand_total = 0
        grand_total_gained = 0
        all_difficulty_sums = {difficulty: 0 for difficulty in AchievementDifficulty}

        for media_type in MediaType:
            media_type_total_gained = 0
            for difficulty in AchievementDifficulty:
                count = completed_counts.get((media_type, difficulty), 0)
                results[media_type].append({"tier": difficulty, "count": count})
                all_difficulty_sums[difficulty] += count
                media_type_total_gained += count

            media_type_total = next((total for mt, total in total_achievements if mt == media_type), 0)
            results[media_type].append({"tier": "total", "count": f"{media_type_total_gained}/{media_type_total}"})

            grand_total += media_type_total
            grand_total_gained += media_type_total_gained

        for difficulty, sum_count in all_difficulty_sums.items():
            results["all"].append({"tier": difficulty, "count": sum_count})
        results["all"].append({"tier": "total", "count": f"{grand_total_gained}/{grand_total}"})

        return results

    @classmethod
    def get_difficulty_summary(cls, user_id: int) -> List[Dict]:
        """ Return a list of dict containing the count for each difficulty tier """

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
            .order_by(tier_order)
            .all()
        )

        return [{"difficulty": diff, "count": count} for diff, count in result]
