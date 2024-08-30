from datetime import datetime, timedelta
from flask import jsonify
from backend.api import db, cache
from backend.tests.base_test import BaseTest


class TestTasks(BaseTest):
    def test_reactivate_update_modal(self):
        from backend.api.managers.TasksManager import TasksManager

        self.user.show_update_modal = False
        db.session.commit()
        self.assertEqual(self.user.show_update_modal, False)

        TasksManager.reactivate_update_modal(True)
        self.assertEqual(self.user.show_update_modal, True)

        TasksManager.reactivate_update_modal(False)
        self.assertEqual(self.user.show_update_modal, False)

    def test_delete_non_activated_users(self):
        from backend.api.models import User
        from backend.api.managers.TasksManager import TasksManager

        # Active
        self.register_new_user("toto")

        # Non-activated > 7 days
        self.register_new_user("bobby")
        bobby = User.query.filter_by(username="bobby").first()
        bobby.active = False
        bobby.registered_on = datetime.utcnow() - timedelta(days=8)

        # Non-activated < 7 days
        self.register_new_user("tutu")
        tutu = User.query.filter_by(username="tutu").first()
        tutu.active = False
        tutu.registered_on = datetime.utcnow() - timedelta(days=5)

        db.session.commit()

        TasksManager.delete_non_activated_users(days=7)

        bobby = User.query.filter_by(username="bobby").first()
        self.assertIsNone(bobby)
        toto = User.query.filter_by(username="toto").first()
        self.assertIsNotNone(toto)
        tutu = User.query.filter_by(username="tutu").first()
        self.assertIsNotNone(tutu)

    def test_update_mylists_stats(self):
        from backend.api.managers.TasksManager import TasksManager
        from backend.api.managers.GlobalStatsManager import GlobalStats

        TasksManager.update_Mylists_stats(GlobalStats)

        cached_stats = cache.get("mylists-stats")
        computed_stats = GlobalStats().compute_global_stats()

        self.assertIsNotNone(cached_stats)
        self.assertEqual(cached_stats.response, jsonify(data=computed_stats).response)
