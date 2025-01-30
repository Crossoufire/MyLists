from __future__ import annotations

import dataclasses
from typing import List, Optional, Callable, Dict

from sqlalchemy import func, case, literal, select, update, exists, insert

from backend.api import db
from backend.api.models import User
from backend.api.utils.functions import naive_utcnow
from backend.api.utils.enums import AchievementDifficulty, MediaType
from backend.api.services.achievements.seeds.manga_seed import manga_achievements
from backend.api.services.achievements.seeds.books_seed import books_achievements
from backend.api.services.achievements.seeds.games_seed import games_achievements
from backend.api.services.achievements.seeds.anime_seed import anime_achievements
from backend.api.services.achievements.factory import AchievementCalculatorFactory
from backend.api.services.achievements.seeds.movies_seed import movies_achievements
from backend.api.services.achievements.seeds.series_seed import series_achievements
from backend.api.models.achievements import UserAchievement, Achievement, AchievementTier


achievement_calc_factory = AchievementCalculatorFactory()


class AchievementService:
    def calculate_achievements(self, code_name: Optional[str], user_ids: Optional[List[int]], callback: Optional[Callable] = None):
        query = Achievement.query
        if code_name:
            query = query.filter(Achievement.code_name == code_name)
        achievements = query.all()

        total_achievements = len(achievements)
        for i, achievement in enumerate(achievements):
            self._calculate_achievement(achievement, user_ids)
            if callback:
                callback((i + 1) / total_achievements)

    def _calculate_achievement(self, achievement: Achievement, user_ids: Optional[List[int]] = None):
        calculator = achievement_calc_factory.create(achievement.code_name)
        subquery = calculator.calculate(achievement, user_ids)
        self._execute_statements(achievement, subquery)

    def _execute_statements(self, achievement: Achievement, subquery: select, **kwargs):
        tiers = AchievementTier.query.filter_by(achievement_id=achievement.id).all()

        for tier in tiers:
            value_needed = kwargs.get("value_needed", tier.criteria["count"])
            completed = kwargs.get("completed", (subquery.c.value >= value_needed))
            count = kwargs.get("count", subquery.c.value)
            progress = func.min(kwargs.get("progress", (subquery.c.value / value_needed) * 100.0), 100.0)
            completed_at = case(
                (completed & (UserAchievement.completed.is_(False)), literal(naive_utcnow())),
                else_=UserAchievement.completed_at
            )

            self._update_achievement(achievement, tier, subquery, completed, count, progress, completed_at)
            self._insert_achievement(achievement, tier, subquery, completed, count, progress)

        db.session.commit()

    @staticmethod
    def get_code_names() -> Dict[str, MediaType]:
        return achievement_calc_factory._code_name_to_media_type

    @staticmethod
    def calculate_achievements_rarity():
        total_active_users = db.session.query(func.count(User.id)).filter(User.active.is_(True)).scalar()

        rarity_subquery = (
            db.session.query(UserAchievement.tier_id, func.count(UserAchievement.user_id).label("count"))
            .filter(UserAchievement.completed.is_(True))
            .group_by(UserAchievement.tier_id)
            .subquery()
        )

        update_stmt = (
            AchievementTier.__table__.update()
            .values(rarity=func.coalesce((100 * rarity_subquery.c.count / total_active_users), 0))
            .where(AchievementTier.id == rarity_subquery.c.tier_id)
        )

        db.session.execute(update_stmt)
        db.session.commit()

    @staticmethod
    def update_achievement(code_name: str, name: Optional[str] = None, description: Optional[str] = None) -> bool:
        achievement = Achievement.query.filter_by(code_name=code_name).first()
        if not achievement:
            return False

        # Update only if `name` and/or `description` are not `None`
        achievement.name = name if name else achievement.name
        achievement.description = description if description else achievement.description
        db.session.commit()

        return True

    @staticmethod
    def update_tier_achievement(code_name: str, tier: AchievementDifficulty, criteria: Dict):
        achievement = Achievement.query.filter_by(code_name=code_name).first()
        if not achievement:
            return False
        tier = [ach for ach in achievement.tiers if ach.difficulty == tier][0]
        tier.criteria = criteria
        db.session.commit()

        return True

    @staticmethod
    def _update_achievement(achievement, tier, subquery, completed, count, progress, completed_at):
        # noinspection PyTypeChecker
        update_stmt = (
            update(UserAchievement)
            .where(
                UserAchievement.tier_id == tier.id,
                UserAchievement.user_id == subquery.c.user_id,
                UserAchievement.achievement_id == achievement.id,
            )
            .values(
                count=count,
                progress=progress,
                completed=completed,
                completed_at=completed_at,
                last_calculated_at=naive_utcnow(),
            )
        )
        db.session.execute(update_stmt)

    @staticmethod
    def _insert_achievement(achievement: Achievement, tier: AchievementTier, subquery: select, completed, count, progress):
        completed_at = case((completed, literal(naive_utcnow())), else_=None)
        columns = ["user_id", "achievement_id", "tier_id", "count", "progress", "completed", "completed_at", "last_calculated_at"]

        # noinspection PyTypeChecker
        select_query = (
            db.session.query(
                subquery.c.user_id,
                literal(achievement.id),
                literal(tier.id),
                count,
                progress,
                completed,
                completed_at,
                literal(naive_utcnow())
            )
            .filter(~exists().where(
                UserAchievement.tier_id == tier.id,
                UserAchievement.user_id == subquery.c.user_id,
                UserAchievement.achievement_id == achievement.id,
            ))
        )
        insert_stmt = insert(UserAchievement).from_select(columns, select_query)
        db.session.execute(insert_stmt)


def apply_seed_achievements():
    achievements_definition = (
            series_achievements() + anime_achievements() + movies_achievements() +
            books_achievements() + games_achievements() + manga_achievements()
    )

    for achievement_data in achievements_definition:
        achievement = Achievement.query.filter_by(code_name=achievement_data.code_name).first()
        if not achievement:
            achievement = Achievement(
                name=achievement_data.name,
                value=achievement_data.value,
                code_name=achievement_data.code_name,
                media_type=achievement_data.media_type,
                description=achievement_data.description,
            )
            db.session.add(achievement)
            db.session.flush()

            for tier_data in achievement_data.tiers:
                # noinspection PyTypeChecker
                tier = AchievementTier(
                    achievement_id=achievement.id,
                    difficulty=tier_data.difficulty,
                    criteria=dataclasses.asdict(tier_data.criteria),
                )
                db.session.add(tier)
                achievement.tiers.append(tier)
        else:
            achievement.name = achievement_data.name
            achievement.value = achievement_data.value
            achievement.code_name = achievement_data.code_name
            achievement.media_type = achievement_data.media_type
            achievement.description = achievement_data.description

            # Remove any non-existing tiers in achievement object
            new_difficulties = {t.difficulty for t in achievement_data.tiers}
            for tier in achievement.tiers:
                if tier.difficulty not in new_difficulties:
                    db.session.delete(tier)

            # Update/add tiers
            for tier_data in achievement_data.tiers:
                existing_tier = next((t for t in achievement.tiers if t.difficulty == tier_data.difficulty), None)
                if existing_tier:
                    # noinspection PyTypeChecker
                    existing_tier.criteria = dataclasses.asdict(tier_data.criteria)
                else:
                    # noinspection PyTypeChecker
                    new_tier = AchievementTier(
                        achievement_id=achievement.id,
                        difficulty=tier_data.difficulty,
                        criteria=dataclasses.asdict(tier_data.criteria),
                    )
                    db.session.add(new_tier)
                    achievement.tiers.append(new_tier)

    db.session.commit()

    # Remove non-existing achievements
    achievements = Achievement.query.all()
    new_code_names = {a.code_name for a in achievements_definition}

    # Remove non-existing achievement code_name
    for achievement in achievements:
        if achievement.code_name not in new_code_names:
            db.session.delete(achievement)

    db.session.commit()
