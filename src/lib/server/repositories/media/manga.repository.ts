import {manga, mangaList} from "@/lib/server/database/schema";
import {BaseRepository} from "@/lib/server/repositories/media/base.repository";


export class MangaRepository extends BaseRepository<typeof manga, typeof mangaList> {
    constructor() {
        super(manga, mangaList);
    }
}
