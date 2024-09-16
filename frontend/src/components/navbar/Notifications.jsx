import {Link} from "@tanstack/react-router";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {queryClient} from "@/api/queryClient";
import {useQuery} from "@tanstack/react-query";
import {LuBell, LuLoader2} from "react-icons/lu";
import {useEffect, useRef, useState} from "react";
import {FaLongArrowAltRight} from "react-icons/fa";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {cn, formatDateTime} from "@/utils/functions";
import {notifPollingInterval} from "@/utils/constants";
import {MutedText} from "@/components/app/base/MutedText";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {notificationsCountOptions, notificationsOptions} from "@/api/queryOptions";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const Notifications = ({ isMobile }) => {
    const popRef = useRef();
    const { setSheetOpen } = useSheet();
    const [isOpen, setIsOpen] = useState(false);
    const { data: notifCount = 0 } = useQuery(notificationsCountOptions());
    const { data: notifs = [], isLoading, refetch } = useQuery(notificationsOptions());

    const handleOnClickOpen = async () => {
        await refetch();
        setIsOpen(true);
        queryClient.setQueryData(["notificationCount"], 0);
    };

    const handlePopoverClose = () => {
        popRef?.current?.click();
        setSheetOpen(false);
    };

    useEffect(() => {
        const intervalId = setInterval(async () => {
            await queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
        }, notifPollingInterval);
        return () => clearInterval(intervalId);
    }, [queryClient]);

    return (
        <Popover modal={isMobile} open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="mr-3 px-1.5" onClick={handleOnClickOpen}>
                        <LuBell className={cn("w-5 h-5 mr-1.5", isMobile && "w-4 h-4 ml-0.5 mr-1.5 -mb-1")}/>
                        {isMobile && <div className="text-lg ml-2 mr-3">Notifications</div>}
                        <Badge variant="notif" className={notifCount > 0 && "bg-destructive"}>
                            {notifCount}
                        </Badge>
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverClose ref={popRef} className="absolute"/>
            <PopoverContent className="p-0 w-[280px] max-h-[390px] overflow-y-auto" align={isMobile ? "start" : "end"}>
                {isLoading ?
                    <div className="flex items-center justify-center p-4">
                        <LuLoader2 className="h-6 w-6 animate-spin"/>
                    </div>
                    :
                    notifs.length === 0 ?
                        <MutedText className="p-3 text-center">No notifications to display</MutedText>
                        :
                        notifs.map(data =>
                            <NotificationItem
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


const NotificationItem = ({ data, handlePopoverClose }) => {
    const to = data.media_type ? `/details/${data.media_type}/${data.media_id}` : `/profile/${data.payload.username}`;

    return (
        <Link to={to} onClick={handlePopoverClose}>
            <div className="py-2.5 px-3.5 hover:bg-neutral-600/20">
                <div className="flex items-center gap-2">
                    {data.media_type ?
                        <div className="grid grid-cols-[0fr_1fr_0fr] items-center gap-3">
                            <MediaIcon mediaType={data.media_type} size={16}/>
                            <div className="truncate">{data.payload.name}</div>
                            {((data.media_type === "anime" || data.media_type === "series") && data.payload?.finale) &&
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
                {data.media_type &&
                    <div className="flex items-center gap-2 text-neutral-400">
                        {data.payload?.new ?
                            <div className="line-clamp-1">{data.payload.message}</div>
                            :
                            <>
                                <div>
                                    {(data.media_type === "anime" || data.media_type === "series") ?
                                        <div>{`S${data.payload.season}.E${data.payload.episode}`}</div>
                                        :
                                        <div>Release</div>
                                    }
                                </div>
                                <div><FaLongArrowAltRight/></div>
                                <div>{formatDateTime(data.payload.release_date)}</div>
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
