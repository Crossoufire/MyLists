import {clsx} from "clsx";
import {twMerge} from "tailwind-merge";
import {FaAngry, FaFrown, FaGrinAlt, FaGrinStars, FaPoop, FaSmile} from "react-icons/fa";


export const cn = (...inputs) => {
    return twMerge(clsx(inputs));
};

export const getScoreValues = () => {
    return [null, 0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
};

export const getFeelingValues = (size = 20) => {
    return [
        { value: null, icon: "--" },
        { value: 0, icon: <FaPoop color="saddlebrown" size={size}/> },
        { value: 1, icon: <FaAngry color="indianred" size={size}/> },
        { value: 2, icon: <FaFrown color="#d0a141" size={size}/> },
        { value: 3, icon: <FaSmile color="darkseagreen" size={size}/> },
        { value: 4, icon: <FaGrinAlt color="#59a643" size={size}/> },
        { value: 5, icon: <FaGrinStars color="#019101" size={size}/> },
    ];
};

export const getPlaytimeValues = () => [0, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150,
    175, 200, 225, 250, 275, 300, 350, 400, 450, 500, 550, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000,
    5000, 6000, 7000, 8000, 9000, 10000];

export const getRedoValues = () => {
    return [...Array(11).keys()];
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

export const genreListsToListsOfDict = (stringList) => {
    if (!Array.isArray(stringList)) {
        return [];
    }

    const listDict = [];

    stringList.forEach((str) => {
        if (str === "All") return;
        const dict = { value: str, label: str };
        listDict.push(dict);
    });

    return listDict;
};

export const sliceIntoParts = (arr, n) => {
    const len = arr.length;
    const partSize = Math.floor(len / n);
    const remainder = len % n;

    const result = [];
    let start = 0;

    for (let i = 0; i < n; i++) {
        const end = start + partSize + (i < remainder ? 1 : 0);
        result.push(arr.slice(start, end));
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

export const getMediaColor = (media) => {
    const colors = {
        "series": "#216e7d",
        "anime": "#945141",
        "movies": "#8c7821",
        "books": "#584c6e",
        "games": "#196219",
    };
    return colors[media];
};

export const formatNumberWithSpaces = (value) => {
    if (value < 10000) return value;
    return value.toLocaleString().replace(/,/g, " ");
};

export const getLevelColor = (intLevel) => {
    const normalizedLevel = Math.pow(intLevel / 350, 0.75);

    if (normalizedLevel <= 0.2) {
        return `hsl(150, 60%, ${70 - normalizedLevel * 50}%)`;
    }
    else if (normalizedLevel <= 0.4) {
        return `hsl(${150 - (normalizedLevel - 0.2) * 375}, 60%, 60%)`;
    }
    else if (normalizedLevel <= 0.6) {
        return `hsl(75, 60%, ${60 - (normalizedLevel - 0.4) * 50}%)`;
    }
    else if (normalizedLevel <= 0.8) {
        return `hsl(${75 - (normalizedLevel - 0.6) * 375}, 60%, 55%)`;
    }
    else {
        return `hsl(0, 60%, ${55 - (normalizedLevel - 0.8) * 25}%)`;
    }
};

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

export const formatMinutes = (minutes, options = {}) => {
    if (isNaN(minutes) || !minutes) {
        return "--";
    }

    const conversions = {
        hours: 60,
        days: 1440,
    };

    if (options.to && conversions[options.to]) {
        const divisor = conversions[options.to];
        const result = minutes / divisor;
        return options.asInt ? Math.floor(result) : result;
    }

    if (options.format === "hm") {
        let hours = Math.floor(minutes / 60);
        let remainingMinutes = minutes % 60;

        if (options.onlyHours) {
            return `${String(hours).padStart(2, "0")} h`;
        }

        return `${String(hours).padStart(2, "0")} h ${String(Math.floor(remainingMinutes)).padStart(2, "0")}`;
    }

    return minutes;
};

export const formatDateTime = (dateInput, options = {}) => {
    if (!dateInput) {
        return "--";
    }

    let date;
    if (typeof dateInput === "number" && dateInput.toString().length === 10) {
        date = new Date(dateInput * 1000);
    }
    else {
        date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) {
        return "--";
    }

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
