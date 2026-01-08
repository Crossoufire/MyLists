import {z} from "zod";
import {RoleType} from "@/lib/utils/enums";
import {auth} from "@/lib/server/core/auth";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const createUserTask = defineTask({
    visibility: "admin",
    name: "create-user-task" as const,
    description: "Create a new user account",
    inputSchema: z.object({
        email: z.email().describe("Email address"),
        password: z.string().min(8).describe("Password (min 8 characters)"),
        username: z.string().min(3).describe("Username for the new account"),
        role: z.enum(RoleType).default(RoleType.USER).describe("User role (user or manager)"),
    }),
    handler: async (ctx, input) => {
        const container = await getContainer();
        const userRepository = container.repositories.user;

        await ctx.step("create-and-verify-user", async () => {
            const { user } = await auth.api.signUpEmail({
                body: {
                    email: input.email,
                    name: input.username,
                    password: input.password,
                },
            });

            const userId = Number(user.id);
            await userRepository.adminUpdateUser(userId, { emailVerified: true, role: input.role });

            ctx.metric("userId", userId);
            ctx.metric("role", input.role);
            ctx.info(`Account ${input.email} created and verified.`);
        });
    },
});
