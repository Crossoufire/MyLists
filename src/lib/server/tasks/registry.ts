import {TaskVisibility} from "@/lib/types/tasks.types";
import {createTaskRegistry} from "@/lib/server/tasks/define-task";
import {createUserTask} from "@/lib/server/tasks/handlers/create-user.task";
import {maintenanceTask} from "@/lib/server/tasks/handlers/maintenance.task";
import {dbMaintenanceTask} from "@/lib/server/tasks/handlers/db-maintenance.task";
import {lockOldMoviesTask} from "@/lib/server/tasks/handlers/lock-old-movies.task";
import {checkHltbWorksTask} from "@/lib/server/tasks/handlers/check-hltb-works.task";
import {updateIgdbTokenTask} from "@/lib/server/tasks/handlers/update-igdb-token.task";
import {seedAchievementsTask} from "@/lib/server/tasks/handlers/seed-achievements.task";
import {bulkMediaRefreshTask} from "@/lib/server/tasks/handlers/bulk-media-refresh.task";
import {removeNonListMediaTask} from "@/lib/server/tasks/handlers/remove-non-list-media.task";
import {calculateAchievementsTask} from "@/lib/server/tasks/handlers/calculate-achievements.task";
import {computeAllUsersStatsTask} from "@/lib/server/tasks/handlers/compute-all-users-stats.task";
import {addGenresToBooksUsingLlmTask} from "@/lib/server/tasks/handlers/add-books-genres-llm.task";
import {addMediaNotificationsTask} from "@/lib/server/tasks/handlers/add-media-notifications.task";
import {deleteNonActivatedUsersTask} from "@/lib/server/tasks/handlers/delete-non-activated-users.task";
import {removeUnusedMediaCoversTask} from "@/lib/server/tasks/handlers/remove-unused-media-covers.task";


export const taskRegistry = createTaskRegistry({
    createUser: createUserTask,
    dbMaintenance: dbMaintenanceTask,
    lockOldMovies: lockOldMoviesTask,
    maintenanceTasks: maintenanceTask,
    checkHltbWorks: checkHltbWorksTask,
    updateIgdbToken: updateIgdbTokenTask,
    seedAchievements: seedAchievementsTask,
    bulkMediaRefresh: bulkMediaRefreshTask,
    removeNonListMedia: removeNonListMediaTask,
    computeAllUsersStats: computeAllUsersStatsTask,
    addMediaNotifications: addMediaNotificationsTask,
    calculateAchievements: calculateAchievementsTask,
    deleteNonActivatedUsers: deleteNonActivatedUsersTask,
    removeUnusedMediaCovers: removeUnusedMediaCoversTask,
    addGenresToBooksUsingLlm: addGenresToBooksUsingLlmTask,
});


export type TaskName = keyof typeof taskRegistry;


export const taskNames = Object.keys(taskRegistry) as TaskName[];


export const getTask = <T extends TaskName>(name: T): (typeof taskRegistry)[T] => {
    const task = taskRegistry[name];
    if (!task) throw new Error(`Unknown task: ${name}`);

    return task;
};


export const getTasksByVisibility = (visibility: TaskVisibility) => {
    return Object.values(taskRegistry).filter((t) => t.meta.visibility === visibility || !t.meta.visibility);
}
