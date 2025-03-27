import {and, desc, eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {Status} from "@/lib/server/utils/enums";
import {moviesList} from "@/lib/server/database/schema";
import {BaseRepository} from "@/lib/server/repositories/media/base.repository";


export class MoviesRepository extends BaseRepository {
    constructor() {
        super(moviesList);
    }

    async getUserFavorites(userId: string, limit = 8) {
        return db.query.moviesList.findMany({
            //@ts-ignore
            where: and(eq(moviesList.userId, userId), eq(moviesList.status, Status.COMPLETED)),
            orderBy: [desc(moviesList.total)],
            limit: limit,
        });
    }
}
