import {sql} from "drizzle-orm";
import {drizzle} from "drizzle-orm/libsql";
import {createClient} from "@libsql/client";
import * as schema from "../src/lib/server/database/schema";
import {account, user} from "../src/lib/server/database/schema";


async function migrateUsers() {
    const client = createClient({ url: "file:../instance/site.db" });
    const db = drizzle(client, { schema });

    console.log("Starting user migration...");

    try {
        const oldUsers = await db.all(sql`SELECT * FROM user_12345`);
        console.log(`Found ${oldUsers.length} users to migrate`);

        for (const oldUser of oldUsers) {
            const [newUser] = await db.insert(user).values({
                id: oldUser.id,
                name: oldUser.username,
                email: oldUser.email,
                emailVerified: oldUser.active,
                image: oldUser.image_file,
                createdAt: oldUser.registered_on,
                updatedAt: oldUser.last_seen ?? oldUser.registered_on,
                profileViews: oldUser.profile_views,
                backgroundImage: oldUser.background_image,
                role: oldUser.role,
                lastNotifReadTime: oldUser.last_notif_read_time,
                showUpdateModal: oldUser.show_update_modal,
                gridListView: oldUser.grid_list_view,
                privacy: oldUser.privacy,
                searchSelector: oldUser.search_selector,
                ratingSystem: oldUser.rating_system,
            }).returning();

            console.log(`Migrated user: ${oldUser.username}`);

            const createdAt = new Date(newUser.createdAt);
            const updatedAt = new Date(newUser.updatedAt);

            // Create account entry for user credentials
            await db.insert(account).values({
                accountId: newUser.id,
                providerId: oldUser.password ? "credential" : null,
                userId: newUser.id,
                accessToken: null,
                refreshToken: null,
                idToken: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                scope: null,
                password: oldUser.password,
                createdAt: createdAt,
                updatedAt: updatedAt,
            });

            console.log(`Created account for user: ${oldUser.username}`);
        }

        console.log("Migration completed successfully!");

        // 3. Drop old table after successful migration
        // await db.run(sql`DROP TABLE user_info`);
        // console.log("Removed old user_info table");
    }
    catch (error) {
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
