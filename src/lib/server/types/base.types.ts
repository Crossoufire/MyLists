import {SQL} from "drizzle-orm";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";


interface FilterDefinition {
    isActive: (args: MediaListArgs) => boolean;
    applyJoin?: (qb: any, args: MediaListArgs) => any;
    getCondition: (args: MediaListArgs) => SQL | undefined;
}


export type FilterDefinitions = Record<string, FilterDefinition>;
