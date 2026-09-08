export const uniqueBy = <T, Key>(items: readonly T[], getKey: (item: T) => Key, limit?: number) => {
    const seen = new Set<Key>();
    const uniqueItems: T[] = [];

    for (const item of items) {
        const key = getKey(item);
        if (seen.has(key)) continue;
        if (limit !== undefined && uniqueItems.length >= limit) break;

        seen.add(key);
        uniqueItems.push(item);
    }

    return uniqueItems;
};


export function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) result[key] = source[key];

    return result;
}
