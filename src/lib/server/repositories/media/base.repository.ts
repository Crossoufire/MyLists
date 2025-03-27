import {SQLiteTableWithColumns} from "drizzle-orm/sqlite-core";


export abstract class BaseRepository {
    protected constructor(protected table: SQLiteTableWithColumns<any>) {
    }
}