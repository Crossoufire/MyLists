import type {NamedValue} from "@/lib/types/stats.types";


export const transformRatingToFeeling = (ratings: NamedValue[]) => {
    const feelingValues = [0, 2, 4, 6, 8, 10];
    const feelings = feelingValues.map((name) => ({ name, value: 0 }));

    ratings.forEach((item) => {
        const rating = Number(item.name);
        if (item.value === 0 || !Number.isFinite(rating)) return;

        const closestFeeling = feelingValues.reduce((prev, curr) => {
            const currentDistance = Math.abs(rating - curr);
            const previousDistance = Math.abs(rating - prev);
            return currentDistance < previousDistance ? curr : prev;
        });

        feelings[feelingValues.indexOf(closestFeeling)].value += item.value;
    });

    return feelings;
};
