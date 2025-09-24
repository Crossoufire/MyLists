import bcrypt from "bcrypt";
import {clientEnv} from "@/env/client";
import {serverEnv} from "@/env/server";
import {betterAuth} from "better-auth";
import {db} from "@/lib/server/database/db";
import {sendEmail} from "@/lib/utils/mail-sender";
import {createServerOnlyFn} from "@tanstack/react-start";
import {reactStartCookies} from "better-auth/react-start";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {userMediaSettings} from "@/lib/server/database/schema";
import {ApiProviderType, MediaType, PrivacyType, RatingSystemType, RoleType} from "@/lib/utils/enums";


const getAuthConfig = createServerOnlyFn(() => betterAuth({
    appName: "MyLists",
    baseURL: clientEnv.VITE_BASE_URL,
    secret: serverEnv.BETTER_AUTH_SECRET,
    telemetry: {
        enabled: false,
    },
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),
    databaseHooks: {
        user: {
            create: {
                after: async (user, _context) => {
                    const mediaTypes = Object.values(MediaType);

                    const userMediaSettingsData = mediaTypes.map(mediaType => ({
                        mediaType,
                        userId: parseInt(user.id, 10),
                        active: (mediaType === MediaType.MOVIES || mediaType === MediaType.SERIES),
                    }));

                    await db.insert(userMediaSettings).values(userMediaSettingsData).onConflictDoNothing();
                },
            }
        },
    },
    user: {
        additionalFields: {
            profileViews: {
                type: "number",
                defaultValue: 0,
                returned: true,
                input: false,
            },
            backgroundImage: {
                type: "string",
                defaultValue: "default.jpg",
                returned: true,
                input: false,
            },
            role: {
                type: "string",
                defaultValue: RoleType.USER,
                returned: true,
                input: false,
            },
            lastNotifReadTime: {
                type: "date",
                returned: true,
                input: false,
            },
            showUpdateModal: {
                type: "boolean",
                defaultValue: true,
                returned: true,
                input: false,
            },
            gridListView: {
                type: "boolean",
                defaultValue: true,
                returned: true,
                input: false,
            },
            privacy: {
                type: "string",
                defaultValue: PrivacyType.RESTRICTED,
                returned: true,
                input: false,
            },
            searchSelector: {
                type: "string",
                defaultValue: ApiProviderType.TMDB,
                returned: true,
                input: false,
            },
            ratingSystem: {
                type: "string",
                defaultValue: RatingSystemType.SCORE,
                returned: true,
                input: false,
            },
        },
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    socialProviders: {
        github: {
            clientId: serverEnv.GITHUB_CLIENT_ID,
            clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
        },
        google: {
            clientId: serverEnv.GOOGLE_CLIENT_ID,
            clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        minPasswordLength: 8,
        maxPasswordLength: 50,
        requireEmailVerification: true,
        resetPasswordTokenExpiresIn: 3600,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                link: url,
                to: user.email,
                username: user.name,
                template: "resetPassword",
                subject: "MyLists - Reset Your Password",
            });
        },
        password: {
            hash: async (password: string) => {
                return bcrypt.hash(password, 12);
            },
            verify: async ({ hash, password }) => {
                const stringifyHash = Buffer.from(hash);
                return bcrypt.compare(password, stringifyHash.toString());
            },
        },
    },
    emailVerification: {
        expiresIn: 3600,
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                username: user.name,
                template: "register",
                link: url + `/profile/${user.name}`,
                subject: "MyLists - Verify your email address",
            });
        },
    },
    advanced: {
        cookiePrefix: "mylists",
        database: {
            useNumberId: true,
        },
    },
    plugins: [
        reactStartCookies(),
    ]
}));


export const auth = getAuthConfig();
