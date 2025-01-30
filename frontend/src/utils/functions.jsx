import {clsx} from "clsx";
import {twMerge} from "tailwind-merge";
import {BookImage, Cat, Gamepad2, Library, Monitor, Popcorn, User} from "lucide-react";
import {FaAngry, FaFrown, FaGrinAlt, FaGrinStars, FaPoop, FaSmile} from "react-icons/fa";


export const cn = (...inputs) => {
    return twMerge(clsx(inputs));
};


// --- Ratings / Redo / Playtime ----------------------------------------------------------------------------

export const getFeelingIcon = (value, { className, size, valueOnly } = {}) => {
    if (!value || value < 0 || value > 10) return "--";

    const feelValues = getFeelingList({ className, size });

    let closest = feelValues[0];
    let smallestDelta = Math.abs(value - feelValues[0].value);
    for (const mood of feelValues) {
        const delta = Math.abs(value - mood.value);
        if (delta < smallestDelta || (delta === smallestDelta && mood.value < closest.value)) {
            closest = mood;
            smallestDelta = delta;
        }
    }

    if (valueOnly) {
        return closest.value;
    }

    return closest.component;
};


export const getFeelingList = ({ className, size = 20 }) => {
    return [
        { value: null, component: "--" },
        { value: 0, component: <FaPoop className={className} color="saddlebrown" size={size}/> },
        { value: 2, component: <FaAngry className={className} color="indianred" size={size}/> },
        { value: 4, component: <FaFrown className={className} color="#d0a141" size={size}/> },
        { value: 6, component: <FaSmile className={className} color="darkseagreen" size={size}/> },
        { value: 8, component: <FaGrinAlt className={className} color="#59a643" size={size}/> },
        { value: 10, component: <FaGrinStars className={className} color="#019101" size={size}/> },
    ];
};


export const getScoreList = () => {
    const MIN_SCORE = 0;
    const MAX_SCORE = 10;
    const STEP = 0.5;

    // Generation
    const scores = Array.from(
        { length: (MAX_SCORE - MIN_SCORE) / STEP + 1 },
        (_, i) => MIN_SCORE + i * STEP,
    );

    return [
        { value: null, component: "--" },
        ...scores.map(value => ({
            value,
            component: value === MAX_SCORE ? value : value.toFixed(1)
        }))
    ];
};


export const getPlaytimeList = () => {
    const ranges = [
        { start: 0, end: 50, step: 5 },
        { start: 60, end: 100, step: 10 },
        { start: 125, end: 300, step: 25 },
        { start: 350, end: 600, step: 50 },
        { start: 700, end: 1000, step: 100 },
        { start: 1500, end: 3000, step: 500 },
        { start: 4000, end: 10000, step: 1000 }
    ];

    const specialCases = [0, 2];

    return [
        ...specialCases,
        ...ranges.flatMap(({ start, end, step }) =>
            Array.from(
                { length: Math.floor((end - start) / step) + 1 },
                (_, i) => start + i * step,
            )
        ).filter(value => !specialCases.includes(value))
    ];
};


export const getRedoList = () => {
    return [...Array(11).keys()];
};


// --- Icons & Colors ---------------------------------------------------------------------------------------


export const getMediaIcon = (mediaType) => {
    const icons = {
        user: User,
        series: Monitor,
        anime: Cat,
        movies: Popcorn,
        games: Gamepad2,
        books: Library,
        manga: BookImage,
    };
    return icons[mediaType];
};


export const getMediaColor = (mediaType) => {
    const colors = {
        user: "#6e6e6e",
        series: "#267f90",
        anime: "#ab5e4b",
        movies: "#a28b27",
        books: "#6b5c86",
        games: "#217f21",
        manga: "#a04646",
    };
    return colors[mediaType] ?? "#868686";
};


export const getStatusColor = (status) => {
    const colors = {
        "Playing": "#334d5c",
        "Reading": "#334d5c",
        "Watching": "#334d5c",
        "Completed": "#45b29d",
        "On Hold": "#efc94c",
        "Multiplayer": "#efc94c",
        "Random": "#e27a3f",
        "Dropped": "#df5a49",
        "Endless": "#48792c",
        "Plan to Watch": "#962d3e",
        "Plan to Read": "#962d3e",
        "Plan to Play": "#962d3e",
    };
    return colors[status];
};


export const diffColors = (difficulty, variant = "text") => {
    if (!difficulty) return null;
    const colors = {
        "border-bronze": "border-amber-700",
        "border-silver": "border-slate-400",
        "border-gold": "border-yellow-600",
        "border-platinum": "border-teal-600",
        "bg-bronze": "bg-amber-700",
        "bg-silver": "bg-slate-400",
        "bg-gold": "bg-yellow-600",
        "bg-platinum": "bg-teal-600",
        "text-bronze": "text-amber-700",
        "text-silver": "text-slate-400",
        "text-gold": "text-yellow-600",
        "text-platinum": "text-teal-600",
    };
    return colors[`${variant}-${difficulty}`];
};


// --- Time Format ------------------------------------------------------------------------------------------


export const globalStatsTimeFormat = (minutes) => {
    const MINUTES_PER_HOUR = 60;
    const HOURS_PER_DAY = 24;
    const DAYS_PER_YEAR = 365.25;
    const MONTHS_ARRAY = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    const years = Math.floor(minutes / (MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR));
    minutes %= MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

    let months = 0;
    let days = Math.floor(minutes / (MINUTES_PER_HOUR * HOURS_PER_DAY));

    while (days >= MONTHS_ARRAY[months % 12]) {
        days -= MONTHS_ARRAY[months % 12];
        months++;
    }

    minutes %= MINUTES_PER_HOUR * HOURS_PER_DAY;
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);

    if (parts.length === 0) return "Less than an hour";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.join(" and ");

    const lastPart = parts.pop();
    return parts.join(", ") + ", and " + lastPart;
};


export const formatMinutes = (minutes, onlyHours = false) => {
    if (isNaN(minutes) || !minutes) return "--";

    let hours = Math.floor(minutes / 60);
    let remainingMinutes = minutes % 60;

    if (onlyHours) {
        return `${String(hours).padStart(2, "0")} h`;
    }

    return `${String(hours).padStart(2, "0")} h ${String(Math.floor(remainingMinutes)).padStart(2, "0")}`;
};


// --- GENERIC FUNCTIONS -------------------------------------------------------------------------------------


export const genreListsToListsOfDict = (stringList) => {
    if (!Array.isArray(stringList)) return [];

    const listDict = [];
    stringList.forEach((str) => {
        if (str === "All") return;
        const dict = { value: str, label: str };
        listDict.push(dict);
    });

    return listDict;
};


export const sliceIntoParts = (array, slices) => {
    const len = array.length;
    const partSize = Math.floor(len / slices);
    const remainder = len % slices;

    const result = [];
    let start = 0;

    for (let i = 0; i < slices; i++) {
        const end = start + partSize + (i < remainder ? 1 : 0);
        result.push(array.slice(start, end));
        start = end;
    }

    return result;
};


export const getLangCountryName = (name, type) => {
    let languageNames = new Intl.DisplayNames(["en"], { type });
    if (name === "cn") return "Chinese";
    return languageNames.of(name.trim());
};


export const zeroPad = (value) => {
    if (value) return String(value).padStart(2, "0");
    return "00";
};


export const capitalize = (str) => {
    if (str) return str.charAt(0).toUpperCase() + str.slice(1);
    return str;
};


export const formatNumberWithKM = (value) => {
    if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(2) + "M";
    }
    else if (value >= 1_000) {
        return (value / 1_000).toFixed(2) + "k";
    }
    return value.toFixed(0).toString();
};


export const formatNumberWithSpaces = (value) => {
    if (value < 10000) return value;
    return value.toLocaleString().replace(/,/g, " ");
};


export const formatDateTime = (dateInput, options = {}) => {
    if (!dateInput) return "--";

    let date = new Date(dateInput);
    if (typeof dateInput === "number" && dateInput.toString().length === 10) {
        date = new Date(dateInput * 1000);
    }

    if (isNaN(date.getTime())) return "--";

    const formatOptions = {
        timeZone: options.useLocalTz ? new Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
        year: "numeric",
        month: options.onlyYear ? undefined : "short",
        day: options.onlyYear ? undefined : "numeric",
        hour: options.includeTime ? "numeric" : undefined,
        minute: options.includeTime ? "numeric" : undefined,
        hour12: false,
    };

    if (options.onlyYear) {
        return date.toLocaleString("en-En", { timeZone: formatOptions.timeZone, year: "numeric" });
    }

    return new Intl.DateTimeFormat("en-En", formatOptions).format(date);
};


export function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


export function jsonToCsv(items) {
    if (!items || !items.length) return "";
    const header = Object.keys(items[0]);
    const headerString = header.join(",");
    const replacer = (key, value) => value ?? "";
    const rowItems = items.map(row =>
        header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(",")
    );
    return [headerString, ...rowItems].join("\r\n");
}
