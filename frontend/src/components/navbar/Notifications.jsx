import {toast} from "sonner";
import {LuBell} from "react-icons/lu";
import {getMediaIcon} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useEffect, useRef, useState} from "react";
import {useSheet} from "@/providers/SheetProvider";
import {Link, useLocation} from "react-router-dom";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/primitives/Loading";
import {FaLongArrowAltRight, FaUser} from "react-icons/fa";
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
            await countNotifications();
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
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center">
                    {isMobile ?
                        <div className=" text-lg font-semibold px-3" onClick={async () => await fetchNotifications()}>
                            <span className="mr-3">Notifications</span>
                            <Badge variant="notif" className={numberUnreadNotif > 0 && "bg-destructive"}>
                                {numberUnreadNotif}
                            </Badge>
                        </div>
                        :
                        <Button variant="ghost" size="sm" onClick={async () => await fetchNotifications()} className="mr-3">
                            <LuBell className="w-5 h-5 mr-1"/>
                            <Badge variant="notif" className={numberUnreadNotif > 0 && "bg-destructive"}>
                                {numberUnreadNotif}
                            </Badge>
                        </Button>
                    }
                </div>
            </PopoverTrigger>
            <PopoverClose ref={popRef} className="absolute"/>
            <PopoverContent className="w-72 max-h-[360px] overflow-y-auto" align={isMobile ? "start" : "end"}>
                {loading ?
                    <Loading forPage={false}/>
                    :
                    notifications.length === 0 ?
                        <i className="text-muted-foreground">No notifications to display</i>
                        :
                        notifications.map((data, idx) =>
                            <div key={data.timestamp}>
                                {!data.media ?
                                    <Link to={`/profile/${data.payload.username}`} onClick={handlePopoverClose}>
                                        <div className="grid grid-cols-12">
                                            <div className="col-span-2">
                                                <FaUser className="text-grey mt-1 ml-3"/>
                                            </div>
                                            <div className="col-span-10">
                                                <span className="line-clamp-1">{data.payload.message}</span>
                                            </div>
                                        </div>
                                    </Link>
                                    :
                                    <MediaLink
                                        data={data}
                                        handlePopoverClose={handlePopoverClose}
                                    />
                                }
                                {idx !== notifications.length -1 && <Separator/>}
                            </div>
                        )
                }
            </PopoverContent>
        </Popover>
    );
};


const MediaLink = ({ data, handlePopoverClose }) => {
    return (
        <Link to={`/details/${data.media}/${data.media_id}`} onClick={handlePopoverClose}>
            <div className="grid grid-cols-12">
                <div className="col-span-2">{getMediaIcon(data.media, 15, "ml-3 mt-5")}</div>
                <div className="col-span-10">
                    <span className="line-clamp-1">{data.payload.name}</span>
                    <div className="flex items-center gap-2 text-neutral-300">
                         {(data.media === "anime" || data.media === "series") ?
                             <div>S{data.payload.season}.E{data.payload.episode}</div>
                             :
                             <div>Release</div>
                         }
                        <div><FaLongArrowAltRight/></div>
                        <div>{data.payload.release_date}</div>
                    </div>
                </div>
            </div>
        </Link>
    );
};