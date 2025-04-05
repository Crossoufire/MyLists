import {series, seriesList} from "@/lib/server/database/schema";
import {BaseRepository} from "@/lib/server/repositories/media/base.repository";


export class SeriesRepository extends BaseRepository<typeof series, typeof seriesList> {
    constructor() {
        super(series, seriesList);
    }
}
