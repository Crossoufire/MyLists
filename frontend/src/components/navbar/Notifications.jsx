import {toast} from "sonner";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useEffect, useRef, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/app/base/Loading";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {FaBell, FaLongArrowAltRight} from "react-icons/fa";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const Notifications = ({ isMobile }) => {
    const api = useApi();
    const popRef = useRef();
    const location = useLocation();
    const { setSheetOpen } = useSheet();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [numberUnreadNotif, setNumberUnreadNotif] = useState(0);

    const countNotifications = async () => {
        const response = await api.get("/notifications/count");
        if (!response.ok) {
            return toast.error(response.body.description);
        }

        setNumberUnreadNotif(response.body.data);
    };

    useEffect(() => {
        (async () => {
            if (api.isAuthenticated()) {
                await countNotifications();
            }
        })();
    }, [location.pathname]);

    const fetchNotifications = async () => {
        setLoading(true);
        const response = await api.get("/notifications");
        setLoading(false);

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        setNotifications(response.body.data);
        setNumberUnreadNotif(0);
    };

    const handlePopoverClose = () => {
        popRef?.current?.click();
        setSheetOpen(false);
    };

    return (
        <Popover modal={isMobile}>
            <PopoverTrigger asChild>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={async () => await fetchNotifications()} className="mr-3">
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
                    <Loading forPage={false}/>
                    :
                    notifications.length === 0 ?
                        <i className="text-muted-foreground">No notifications to display</i>
                        :
                        notifications.map(data =>
                            <MediaLink
                                key={data.timestamp}
                                data={data}
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
                        <>
                            <MediaIcon mediaType={data.media} size={16}/>
                            <div>
                                {data.payload.name} &nbsp;
                                {((data.media === "anime" || data.media === "series") && data.payload?.finale) &&
                                    <Badge variant="passiveSmall">Finale</Badge>
                                }
                            </div>
                        </>
                        :
                        <>
                            <MediaIcon mediaType={"user"} size={16}/>
                            <div className="line-clamp-1">{data.payload.message}</div>
                        </>
                    }
                </div>
                {data.media &&
                    <div className="flex items-center gap-2 text-neutral-400">
                        <div>
                            {(data.media === "anime" || data.media === "series") ?
                                <div>{`S${data.payload.season}.E${data.payload.episode}`}</div>
                                :
                                <div>Release</div>
                            }
                        </div>
                        <div><FaLongArrowAltRight/></div>
                        <div>{data.payload.release_date}</div>
                    </div>
                }
            </div>
            <Separator className="mt-0 mb-0"/>
        </Link>
    );
};
