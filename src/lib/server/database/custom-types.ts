import {CoverType} from "@/lib/types/base.types";
import {getImageUrl} from "@/lib/utils/image-url";
import {customType} from "drizzle-orm/sqlite-core";


export const customJson = <TData>(name: string) =>
    customType<{ data: TData; driverData: string }>({
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


export const imageUrl = (name: string, coverType: CoverType) =>
    customType<{ data: string; driverData: string }>({
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
