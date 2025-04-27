import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {managerAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getAdminAllUsers = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data }) => {
        const userService = getContainer().services.user;
        return userService.getPaginatedUsers(data);
    });


export const postAdminUpdateUser = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { userId: number, payload: Record<string, any> })
    .handler(async ({ data: { userId, payload } }) => {

    });


export const getAdminOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        const userService = getContainer().services.user;
        return userService.getAdminOverview();
    });
