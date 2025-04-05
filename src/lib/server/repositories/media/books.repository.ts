import {books, booksList} from "@/lib/server/database/schema";
import {BaseRepository} from "@/lib/server/repositories/media/base.repository";


export class BooksRepository extends BaseRepository<typeof books, typeof booksList> {
    constructor() {
        super(books, booksList);
    }
}
