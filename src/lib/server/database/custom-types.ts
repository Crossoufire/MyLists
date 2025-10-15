import {CoverType} from "@/lib/types/base.types";
import {getImageUrl} from "@/lib/utils/image-url";
import {customType} from "drizzle-orm/sqlite-core";


export const customJson = <TData>(name: string) => customType<{ data: TData; driverData: string }>({
    dataType() {
        return "text";
    },
    toDriver(value: TData) {
        return JSON.stringify(value);
    },
    fromDriver(value: string): TData {
        return JSON.parse(value);
    }
})(name);


export const imageUrl = (name: string, coverType: CoverType) => customType<{ data: string; driverData: string }>({
    dataType() {
        return "text";
    },
    toDriver(value: string) {
        return value;
    },
    fromDriver(value: string) {
        return getImageUrl(coverType, value);
    },
})(name);


/**
 * When better-auth create a the new user in the `user` table, `createdAt` and `updatedAt` are given as Date (timestamp in ms)
 * but my app needs ISO string (UTC) but in the SQLite format, This is a custom type to convert Date to string and return it as string.
 **/
export const dateAsString = (name: string) => customType<{ data: string; driverData: string }>({
    dataType() {
        return "text";
    },
    toDriver(value: string | Date) {
        if (value instanceof Date) {
            return value.toISOString().replace("T", " ").replace("Z", "000");
        }
        return value;
    },
    fromDriver(value: string) {
        return value;
    },
})(name);
