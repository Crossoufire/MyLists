import {clsx} from "clsx";
import {twMerge} from "tailwind-merge";
import {
    FaAngry,
    FaBook,
    FaFilm,
    FaFrown,
    FaGamepad,
    FaGrinAlt,
    FaGrinStars,
    FaPoop,
    FaSmile,
    FaToriiGate,
    FaTv
} from "react-icons/fa";


export const cn = (...inputs) => {
    return twMerge(clsx(inputs));
}

export const zeroPad = value => {
    if (value) {
        return String(value).padStart(2, "0");
    }

    return "00"
};

export const capitalize = str => {
    if (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

export const createLocalDate = date_ => {
    if (date_) {
        let tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
        let localDate = new Date(date_).toLocaleString("en-GB", {timeZone: tz});
        let d = new Date(date_);
        const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        return `${localDate.slice(0, 2)} ${month[d.getMonth()]} ${d.getFullYear()} at ${localDate.slice(11, 17)}`
    }
};

export const formatTime = (minutes, onlyHours) => {
    if (isNaN(minutes)) {
        return "--";
    }

    let hours = Math.floor(minutes / 60);
    let remainingMinutes = minutes % 60;

    if (onlyHours) return hours + "h"

    return hours + "h" + (remainingMinutes < 10 ? "0" : "") + remainingMinutes.toFixed(0);
};

export const getUserMetric = (isFeeling, userData) => {
    const name = isFeeling ? "Feeling" : "Score";
    const value = isFeeling ? userData.feeling : userData.score;

    return {name, value};
};

export const getRatingValues = (isFeeling, size = 20) => {
    if (isFeeling) {
        return [
            {value: null, icon: "---"},
            {value: 0, icon: <FaPoop color="saddlebrown" size={size}/>},
            {value: 1, icon: <FaAngry color="indianred" size={size}/>},
            {value: 2, icon: <FaFrown color="#d0a141" size={size}/>},
            {value: 3, icon: <FaSmile color="darkseagreen" size={size}/>},
            {value: 4, icon: <FaGrinAlt color="#59a643" size={size}/>},
            {value: 5, icon: <FaGrinStars color="#019101" size={size}/>},
        ]
    }

    return [null, 0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
};

export const getPlaytimeValues = () => [0, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 275, 300,
    350, 400, 450, 500, 550, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000,
    9000, 10000];

export const getRedoValues = () => [...Array(11).keys()];

export const getMediaIcon = (mediaType, size, cl) => {
    const iconMappings = {
        series: FaTv,
        anime: FaToriiGate,
        movies: FaFilm,
        games: FaGamepad,
        books: FaBook,
    };
    const IconComp = iconMappings[mediaType];
    return <IconComp className={`text-${mediaType} ${cl}`} size={size}/>;
};

export const changeValueFormat = (value, label="") => {
    if (value > 10000) {
        return `${value.toLocaleString().replace(/,/g, " ")} ${label}`;
    } else {
        return `${value} ${label}`;
    }
};

export const getStatusColor = (status) => {
    const colors = {
        "Reading": "#334d5c",
        "Watching": "#334d5c",
        "Completed": "#45b29d",
        "On Hold": "#efc94c",
        "Random": "#e27a3f",
        "Multiplayer": "#efc94c",
        "Dropped": "#df5a49",
        "Endless": "#48792c",
        "Plan to Watch": "#962d3e",
        "Plan to Read": "#962d3e",
        "Plan to Play": "#962d3e",
    }

    return colors[status];
};

export const formatDate = dateString => {
    const originalDate = new Date(dateString);
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "numeric"};
    return originalDate.toLocaleString("en", options);
};

export const getMediaColor = (media) => {
    const colors = {
        "series": "#216e7d",
        "anime": "#945141",
        "movies": "#8c7821",
        "books": "#584c6e",
        "games": "#196219",
    }

    return colors[media];
};

export const genreListsToListsOfDict = (stringList) => {
    const listDict = [];

    stringList.forEach((str) => {
        if (str === "All") {
            return;
        }
        const dict = { value: str,  label: str };
        listDict.push(dict);
    });

    return listDict;
};