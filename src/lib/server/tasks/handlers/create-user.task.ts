import {z} from "zod";
import {RoleType} from "@/lib/utils/enums";
import {auth} from "@/lib/server/core/auth";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const createUserTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Create a new user account",
    },
    inputSchema: z.object({
        email: z.email().describe("Email address"),
        password: z.string().min(8).describe("Password (min 8 characters)"),
        username: z.string().min(3).describe("Username for the new account"),
        role: z.enum(RoleType).default(RoleType.USER).describe("User role (user or manager)"),
    }),
    handler: async (ctx) => {
        ctx.logger.info(`Creating user: ${ctx.input.username}`);

        const container = await getContainer();
        const userRepository = container.repositories.user;

        const { user } = await auth.api.signUpEmail({
            body: {
                email: ctx.input.email,
                name: ctx.input.username,
                password: ctx.input.password,
            },
        });

        await userRepository.adminUpdateUser(Number(user.id), { emailVerified: true, role: ctx.input.role });

        ctx.logger.info(`User ${ctx.input.username} created successfully.`);
        ctx.logger.info(`An email was send to ${ctx.input.email} but the account was validated automatically.`);
    },
});
