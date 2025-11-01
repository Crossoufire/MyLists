import path, {join} from "path";
import {sql} from "drizzle-orm";
import {execSync} from "child_process";
import {drizzle} from "drizzle-orm/libsql";
import {db} from "@/lib/server/database/db";
import {account, user} from "@/lib/server/database/schema";
import {backPopulateMediaListTimestamps} from "./back-populate";
import {existsSync, readdirSync, readFileSync, rmSync, writeFileSync} from "fs";


const PROJECT_ROOT = process.cwd();
const DRIZZLE_FOLDER = path.join(PROJECT_ROOT, "drizzle");
const CONFIG_PATH = path.join(PROJECT_ROOT, "drizzle.config.ts");
const ENUM_UPDATES_FILE = path.join(PROJECT_ROOT, "scripts", "change-enums.sql");


const replaceSQLContent = () => {
    if (!existsSync(DRIZZLE_FOLDER)) {
        console.log("No DRIZZLE_FOLDER found; skipping replace.");
        return;
    }

    const findSQLFiles = (dir: string): string[] => {
        const files: string[] = [];
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.name.endsWith(".sql")) {
                files.push(fullPath);
            }
        }
        return files;
    };

    const sqlFiles = findSQLFiles(DRIZZLE_FOLDER);
    if (sqlFiles.length === 0) {
        console.log("No .sql files found in migrations; skipping replace.");
        return;
    }

    for (const file of sqlFiles) {
        const content = readFileSync(file, "utf-8");
        if (content.trim() && !content.includes("SELECT 1=0;")) {
            writeFileSync(file, "SELECT 1=0;\n");
            console.log(`Replaced content in ${path.relative(PROJECT_ROOT, file)}`);
        }
    }
};


const cleanupDrizzleFolder = () => {
    if (!existsSync(DRIZZLE_FOLDER)) {
        console.log("Drizzle folder not found; skipping cleanup.");
        return;
    }

    for (const entry of readdirSync(DRIZZLE_FOLDER, { withFileTypes: true })) {
        const fullPath = path.join(DRIZZLE_FOLDER, entry.name);
        rmSync(fullPath, { recursive: true, force: true });
        console.log(`Cleaned drizzle/: ${entry.name}`);
    }
};


const switchSchema = (newSchemaPath: string) => {
    if (!existsSync(CONFIG_PATH)) {
        throw new Error(`Config file not found: ${CONFIG_PATH}`);
    }

    let content = readFileSync(CONFIG_PATH, "utf-8");

    const regex = /schema:\s*"[^"]*"/g;
    content = content.replace(regex, `schema: "${newSchemaPath}"`);

    if (!content.includes(newSchemaPath)) {
        throw new Error(`Failed to switch schema to: ${newSchemaPath}`);
    }

    writeFileSync(CONFIG_PATH, content);
    console.log(`Switched schema to: ${newSchemaPath}`);
};


const runDrizzleKit = (command: string, options?: { cwd?: string }) => {
    const cwd = options?.cwd || PROJECT_ROOT;
    const drizzleKitPath = join(cwd, "node_modules", ".bin", "drizzle-kit");

    try {
        console.log(`Running: drizzle-kit ${command} (cwd: ${cwd})`);

        const output = execSync(`"${drizzleKitPath}" ${command}`, {
            timeout: 20_000,
            encoding: "utf8",
            stdio: "pipe",
            env: { ...process.env },
            cwd: cwd,
        });

        console.log(`drizzle-kit ${command}: Success`);
        if (output) console.log(`Output: ${output.trim()}`);
        return output;
    }
    catch (err: any) {
        console.error(`drizzle-kit ${command}: Failed`);
        if (err.stdout) console.log('stdout:', err.stdout.toString());
        if (err.stderr) console.error('stderr:', err.stderr.toString());
        throw err;
    }
};


const execRawSQL = async (db: ReturnType<typeof drizzle>, queries: string | string[], logPrefix: string = "") => {
    const sqlArray = Array.isArray(queries) ? queries : [queries];
    for (const q of sqlArray) {
        try {
            console.log(`${logPrefix} Executing: ${q.substring(0, Math.min(50, q.length))}...`);
            await db.run(sql.raw(q));
            console.log(`${logPrefix} Done`);
        }
        catch (err) {
            console.error(`${logPrefix} Failed:`, err);
            throw err;
        }
    }
};


const splitSqlStatements = (sql: string) => sql.split(";").map((s) => s.trim()).filter((s) => s.length > 0);


const migrateUsers = async (db: ReturnType<typeof drizzle>) => {
    console.log("Starting user migration...");
    const oldUsers: Record<string, any>[] = await db.all(sql`SELECT * FROM user_12345`);
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
    console.log("User migration completed successfully!");
};


const runAutomatedMigration = async () => {
    console.log("Starting automated DB migration...");

    try {
        // Add new cols to all media types (multi-statement)
        await execRawSQL(db, [
            "ALTER TABLE series ADD COLUMN added_at TEXT;",
            "ALTER TABLE series_list ADD COLUMN added_at TEXT;",
            "ALTER TABLE series_list ADD COLUMN last_updated TEXT;",

            "ALTER TABLE anime ADD COLUMN added_at TEXT;",
            "ALTER TABLE anime_list ADD COLUMN added_at TEXT;",
            "ALTER TABLE anime_list ADD COLUMN last_updated TEXT;",

            "ALTER TABLE movies ADD COLUMN compositor_name TEXT;",
            "ALTER TABLE movies ADD COLUMN collection_id INTEGER;",
            "ALTER TABLE movies ADD COLUMN added_at TEXT;",
            "ALTER TABLE movies_list ADD COLUMN added_at TEXT;",
            "ALTER TABLE movies_list ADD COLUMN last_updated TEXT;",

            "ALTER TABLE games ADD COLUMN added_at TEXT;",
            "ALTER TABLE games_list ADD COLUMN added_at TEXT;",
            "ALTER TABLE games_list ADD COLUMN last_updated TEXT;",

            "ALTER TABLE books ADD COLUMN added_at TEXT;",
            "ALTER TABLE books_list ADD COLUMN added_at TEXT;",
            "ALTER TABLE books_list ADD COLUMN last_updated TEXT;",

            "ALTER TABLE manga ADD COLUMN added_at TEXT;",
            "ALTER TABLE manga_list ADD COLUMN added_at TEXT;",
            "ALTER TABLE manga_list ADD COLUMN last_updated TEXT;",
        ], "Add columns:");

        // Rename `IGDB_url` to `igdb_url` in Games
        await execRawSQL(db, "ALTER TABLE games RENAME COLUMN IGDB_url TO igdb_url;", "Rename columns:");

        // Rename `last_episode_watched` to `current_episode` in Series and Anime
        await execRawSQL(db, [
            "ALTER TABLE series_list RENAME COLUMN last_episode_watched TO current_episode;",
            "ALTER TABLE anime_list RENAME COLUMN last_episode_watched TO current_episode;",
        ], "Rename columns:");

        // Disable FK, rename old user
        await execRawSQL(db, "PRAGMA foreign_keys = OFF;", "Disable FK:");
        await execRawSQL(db, "ALTER TABLE user RENAME TO user_12345;", "Rename old user:");

        // Remove "default.jpg" image from user profile
        await execRawSQL(db, "UPDATE user SET image = NULL WHERE image = 'default.jpg';", "Remove default image:");

        // Drop token, sqlite_stat1 and alembic_version tables
        await execRawSQL(db, [
            "DROP TABLE alembic_version;",
            "DROP TABLE token;",
            "DROP TABLE sqlite_stat1;",
        ], "Drop tables:");

        // Edit drizzle.config.ts to auth schema
        switchSchema("./src/lib/server/database/schema/auth.schema.ts");

        // Add auth tables from better-auth
        runDrizzleKit("generate");
        runDrizzleKit("migrate");

        // Migrate users
        await migrateUsers(db)

        // Drop old user_12345, rename new user → user_12345
        await execRawSQL(db, "DROP TABLE user_12345;", "Drop old user:");
        await execRawSQL(db, "ALTER TABLE user RENAME TO user_12345;", "Rename new user temp:");

        // Rename back to user with FK on
        await execRawSQL(db, "PRAGMA foreign_keys = ON;", "Enable FK:");
        await execRawSQL(db, "ALTER TABLE user_12345 RENAME TO user;", "Rename final:");

        // Check FK and all OK
        const fkCheck = await db.all(sql`PRAGMA foreign_key_check;`);
        if (fkCheck.length > 0) {
            throw new Error(`Foreign key check failed: ${JSON.stringify(fkCheck)}`);
        }
        console.log("Foreign key check passed");

        // Edit drizzle.config.ts back to index schema
        switchSchema("./src/lib/server/database/schema/index.ts");

        // Cleanup files, Introspect, and remove relation.ts and schema.ts
        cleanupDrizzleFolder();
        runDrizzleKit("introspect");
        for (const file of ["relations.ts", "schema.ts"]) {
            const filePath = path.join(DRIZZLE_FOLDER, file);
            rmSync(filePath, { force: true });
            console.log(`Deleted post-introspect file: ${path.relative(PROJECT_ROOT, filePath)}`);
        }

        // Replace SQL content
        replaceSQLContent();

        // Generate and migrate diff
        runDrizzleKit("generate");
        runDrizzleKit("migrate");

        // Update enums from file
        if (!existsSync(ENUM_UPDATES_FILE)) {
            throw new Error(`Enum updates file not found: ${ENUM_UPDATES_FILE}`);
        }
        const sqlFileContent = readFileSync(ENUM_UPDATES_FILE, "utf-8");
        const sqlStatements = splitSqlStatements(sqlFileContent);
        await execRawSQL(db, sqlStatements, "Update enums: ");

        console.log("Migration complete!");

        console.log("Running `back-populate.ts` script to back populate the MediaList timestamps...");
        await backPopulateMediaListTimestamps();

        // console.log("Running `back-populate-movies.ts` script to back populate collectionIds and compositors...");
        // await backPopulateCollectionIdsAndCompositorsForMovies();
    }
    catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};


runAutomatedMigration()
    .then(() => console.log("All done!"))
    .catch((err) => {
        console.error("Process failed:", err);
        process.exit(1);
    });
