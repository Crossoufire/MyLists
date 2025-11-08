import {db} from "@/lib/server/database/db";
import {MediaType} from "@/lib/utils/enums";
import {getTableName, sql} from "drizzle-orm";
import {ListTable} from "@/lib/types/media.config.types";
import {animeList, booksList, gamesList, mangaList, moviesList, seriesList} from "@/lib/server/database/schema";


const mediaListTables: { mediaType: MediaType, listTable: ListTable }[] = [
    { mediaType: MediaType.SERIES, listTable: seriesList },
    { mediaType: MediaType.ANIME, listTable: animeList },
    { mediaType: MediaType.MOVIES, listTable: moviesList },
    { mediaType: MediaType.GAMES, listTable: gamesList },
    { mediaType: MediaType.BOOKS, listTable: booksList },
    { mediaType: MediaType.MANGA, listTable: mangaList },
];


export const backPopulateMediaListTimestamps = async () => {
    for (const { mediaType, listTable } of mediaListTables) {
        console.log(`Processing ${mediaType}...`);
        const tableName = getTableName(listTable);

        await db.run(sql`
            UPDATE ${sql.identifier(tableName)}
            SET added_at = (
                SELECT MIN(timestamp) 
                FROM user_media_update
                WHERE user_id = ${sql.identifier(tableName)}.user_id
                    AND media_id = ${sql.identifier(tableName)}.media_id
                    AND media_type = ${mediaType}
            ),
            last_updated = (
                SELECT MAX(timestamp) 
                FROM user_media_update
                WHERE user_id = ${sql.identifier(tableName)}.user_id 
                    AND media_id = ${sql.identifier(tableName)}.media_id
                    AND media_type = ${mediaType}
            )
        `);

        console.log(`✓ ${mediaType} complete`);
    }

    console.log("\n✓ Done!");
};


if (import.meta.main) {
    backPopulateMediaListTimestamps()
        .then(() => console.log("All done!"))
        .catch((err) => {
            console.error("Process failed:", err);
            process.exit(1);
        });
}
