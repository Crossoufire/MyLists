import {sql} from "drizzle-orm";
import {drizzle} from "drizzle-orm/libsql";
import {createClient} from "@libsql/client";
import * as schema from "~/lib/server/schema";
import {account, user} from "~/lib/server/schema";


async function migrateUsers() {
    const client = createClient({ url: "file:./site.db" });
    const db = drizzle(client, { schema });

    console.log("Starting user migration...");

    try {
        // 1. Fetch all users from old table
        const oldUsers = await db.all(sql`SELECT * FROM user_info`);
        console.log(`Found ${oldUsers.length} users to migrate`);

        console.log(oldUsers);

        // 2. Migrate each user
        for (const oldUser of oldUsers) {
            const createdAt = new Date(oldUser.registered ?? new Date());
            const updatedAt = new Date(oldUser.lastSeen ?? new Date());

            // Insert into new user table
            const [newUser] = await db.insert(user).values({
                name: oldUser.username,
                email: oldUser.email,
                emailVerified: true,
                image: null,
                createdAt: createdAt,
                updatedAt: updatedAt,
                role: oldUser.role,
            }).returning();

            console.log(newUser);

            console.log(`Migrated user: ${oldUser.username}`);

            // Create account entry for user credentials
            await db.insert(account).values({
                userId: newUser.id,
                providerId: "credential",
                accountId: newUser.id,
                password: oldUser.password,
                accessToken: null,
                refreshToken: null,
                idToken: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                scope: null,
                createdAt: createdAt,
                updatedAt: updatedAt,
            });

            console.log(`Created account for user: ${oldUser.username}`);
        }

        console.log("Migration completed successfully!");

        // 3. Drop old table after successful migration
        await db.run(sql`DROP TABLE user_info`);
        console.log("Removed old user_info table");
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
}


// Run migration
migrateUsers()
    .then(() => {
        console.log("Migration process completed");
    })
    .catch((err) => {
        console.error("Migration process failed:", err);
        process.exit(1);
    });
