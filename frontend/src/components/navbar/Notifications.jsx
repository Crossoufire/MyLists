import {toast} from "sonner";
import {api} from "@/api/MyApiClient";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {POLL_NOTIF_INTER} from "@/lib/constants";
import {useEffect, useRef, useState} from "react";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/app/base/Loading";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {FaBell, FaLongArrowAltRight} from "react-icons/fa";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const Notifications = ({ isMobile }) => {
    const popRef = useRef();
    const { setSheetOpen } = useSheet();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [numberUnreadNotif, setNumberUnreadNotif] = useState(0);
    const [lastNotifPollTime, setLastNotifPollTime] = useState(() => {
        const savedTime = localStorage.getItem("lastNotifPollTime");
        return savedTime ? parseInt(savedTime, 10) : null;
    });

    useEffect(() => {
        let timeoutId;

        const setNextPoll = () => {
            const currentTime = Date.now();
            const nextPollTime = lastNotifPollTime ? (lastNotifPollTime + POLL_NOTIF_INTER) : currentTime;
            const delay = Math.max(nextPollTime - currentTime, 0);
            timeoutId = setTimeout(pollCountNotifications, delay);
        };

        const pollCountNotifications = async () => {
            const response = await api.get("/notifications/count");
            if (response.ok) {
                setNumberUnreadNotif(response.body.data);
            } else {
                toast.error("An error occurred trying to fetch the notifications.");
            }

            const currentTime = Date.now();
            localStorage.setItem("lastNotifPollTime", currentTime.toString());
            setLastNotifPollTime(currentTime);
        };

        if (api.isAuthenticated()) {
            setNextPoll();
        }

        return () => clearTimeout(timeoutId);
    }, [lastNotifPollTime]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get("/notifications");

            if (!response.ok) {
                return toast.error("Failed to retrieve the notifications");
            }

            setNotifications(response.body.data);
            setNumberUnreadNotif(0);
        }
        finally {
            setLoading(false);
        }
    };

    const handlePopoverClose = () => {
        popRef?.current?.click();
        setSheetOpen(false);
    };

    return (
        <Popover modal={isMobile}>
            <PopoverTrigger asChild>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="mr-3" onClick={fetchNotifications}>
                        <FaBell className="w-5 h-5 mr-1"/>
                        {isMobile && <div className="text-lg ml-2 mr-3">Notifications</div>}
                        <Badge variant="notif" className={numberUnreadNotif > 0 && "bg-destructive"}>
                            {numberUnreadNotif}
                        </Badge>
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverClose ref={popRef} className="absolute"/>
            <PopoverContent className="p-0 w-[280px] max-h-[390px] overflow-y-auto" align={isMobile ? "start" : "end"}>
                {loading ?
                    <div className="p-3"><Loading/></div>
                    :
                    notifications.length === 0 ?
                        <i className="text-muted-foreground">No notifications to display</i>
                        :
                        notifications.map(data =>
                            <MediaLink
                                data={data}
                                key={data.timestamp}
                                handlePopoverClose={handlePopoverClose}
                            />
                        )
                }
            </PopoverContent>
        </Popover>
    );
};


const MediaLink = ({ data, handlePopoverClose }) => {
    const dest = data.media ? `/details/${data.media}/${data.media_id}` : `/profile/${data.payload.username}`;

    return (
        <Link to={dest} onClick={handlePopoverClose}>
            <div className="py-2.5 px-3.5 hover:bg-neutral-600/20">
                <div className="flex items-center gap-2">
                    {data.media ?
                        <div className="grid grid-cols-[0fr_1fr_0fr] items-center gap-3">
                            <MediaIcon mediaType={data.media} size={16}/>
                            <div className="truncate">{data.payload.name}</div>
                            {((data.media === "anime" || data.media === "series") && data.payload?.finale) &&
                                <Badge variant="passiveSmall">Finale</Badge>
                            }
                        </div>
                        :
                        <>
                            <MediaIcon mediaType="user" size={16}/>
                            <div className="line-clamp-1">{data.payload.message}</div>
                        </>
                    }
                </div>
                {data.media &&
                    <div className="flex items-center gap-2 text-neutral-400">
                        {data.payload?.new ?
                            <div className="line-clamp-1">{data.payload.message}</div>
                            :
                            <>
                                <div>
                                    {(data.media === "anime" || data.media === "series") ?
                                        <div>{`S${data.payload.season}.E${data.payload.episode}`}</div>
                                        :
                                        <div>Release</div>
                                    }
                                </div>
                                <div><FaLongArrowAltRight/></div>
                                <div>{data.payload.release_date}</div>
                            </>
                        }
                    </div>
                }
            </div>
            <Separator className="mt-0 mb-0"/>
        </Link>
    )
        ;
};
