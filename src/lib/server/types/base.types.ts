import {SQL} from "drizzle-orm";


interface FilterConditionArgs {
    userId: number;
    [key: string]: any;
    currentUserId?: number;
}


interface FilterDefinition {
    isActive: (args: FilterConditionArgs) => boolean;
    applyJoin?: (qb: any, args: FilterConditionArgs) => any;
    getCondition: (args: FilterConditionArgs) => SQL | undefined;
}


export type FilterDefinitions = Record<string, FilterDefinition>;
