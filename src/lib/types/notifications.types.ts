import {Status} from "@/lib/utils/enums";


export type NotifTab = "social" | "media";

export type UpComingMedia = {
    userId: number;
    status: Status;
    mediaId: number;
    mediaName: string;
    imageCover: string;
    date: string | null;
    lastEpisode?: number | null;
    seasonToAir?: number | null;
    episodeToAir?: number | null;
};
