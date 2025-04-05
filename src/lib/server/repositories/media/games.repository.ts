import {games, gamesList} from "@/lib/server/database/schema";
import {BaseRepository} from "@/lib/server/repositories/media/base.repository";


export class GamesRepository extends BaseRepository<typeof games, typeof gamesList> {
    constructor() {
        super(games, gamesList);
    }
}
