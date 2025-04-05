import {anime, animeList} from "@/lib/server/database/schema";
import {BaseRepository} from "@/lib/server/repositories/media/base.repository";


export class AnimeRepository extends BaseRepository<typeof anime, typeof animeList> {
    constructor() {
        super(anime, animeList);
    }
}
