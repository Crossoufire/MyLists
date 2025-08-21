import bcrypt from "bcrypt";
import {betterAuth} from "better-auth";
import {db} from "@/lib/server/database/db";
import {sendEmail} from "@/lib/server/utils/mail-sender";
import {reactStartCookies} from "better-auth/react-start";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {userMediaSettings} from "@/lib/server/database/schema";
import {ApiProviderType, MediaType, PrivacyType, RatingSystemType, RoleType} from "@/lib/server/utils/enums";


export const auth = betterAuth({
    appName: "MyLists",
    baseURL: process.env.VITE_BASE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
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
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        minPasswordLength: 8,
        maxPasswordLength: 50,
        requireEmailVerification: true,
        resetPasswordTokenExpiresIn: 1800,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                link: url,
                to: user.email,
                username: user.name,
                template: "password_reset",
                subject: "MyLists - Reset your password",
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
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: false,
        expiresIn: 3600,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                link: url,
                to: user.email,
                username: user.name,
                template: "register",
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
});
