import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/components/ui/badge";
import {Button} from "@/lib/components/ui/button";
import {useEffect, useRef, useState} from "react";
import {MediaType} from "@/lib/server/utils/enums";
import {formatDateTime} from "@/lib/utils/functions";
import {useSheet} from "@/lib/contexts/sheet-context";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/app/MutedText";
import {MediaAndUserIcon} from "@/lib/components/media/base/MediaAndUserIcon";
import {Bell, LoaderCircle, MoveRight} from "lucide-react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {notificationsCountOptions, notificationsOptions, queryKeys} from "@/lib/react-query/query-options/query-options";


export const Notifications = ({ isMobile }: { isMobile?: boolean }) => {
    const popRef = useRef(null);
    const { setSheetOpen } = useSheet();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const { data: notifCount = 0 } = useQuery(notificationsCountOptions());
    const { data: notifs = [], isLoading, refetch } = useQuery(notificationsOptions());

    const handleOnClickOpen = async () => {
        await refetch();
        setIsOpen(true);
        queryClient.setQueryData(queryKeys.notificationCountKey(), 0);
    };

    const handlePopoverClose = () => {
        // @ts-expect-error
        popRef?.current?.click();
        setSheetOpen(false);
    };

    useEffect(() => {
        const intervalId = setInterval(async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.notificationCountKey() });
        }, 30 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [queryClient]);

    return (
        <Popover modal={isMobile} open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" className="mr-3 px-1.5" onClick={handleOnClickOpen}>
                        <Bell className={cn("w-5 h-5 mr-0.5", isMobile && "w-4 h-4 ml-2")}/>
                        {isMobile && <div className="text-base ml-2 mr-3">Notifications</div>}
                        <Badge className={cn(notifCount > 0 && "bg-destructive")}>
                            {notifCount}
                        </Badge>
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverClose ref={popRef} className="absolute"/>
            <PopoverContent className="p-0 w-[280px] max-h-[390px] overflow-y-auto max-sm:max-h-[350px]" align={isMobile ? "start" : "end"}>
                {isLoading ?
                    <div className="flex items-center justify-center p-4">
                        <LoaderCircle className="h-6 w-6 animate-spin"/>
                    </div>
                    :
                    notifs.length === 0 ?
                        <MutedText className="p-3 text-center">No notifications to display</MutedText>
                        :
                        notifs.map((data, idx) =>
                            <NotificationItem
                                key={idx}
                                data={data}
                                handlePopoverClose={handlePopoverClose}
                            />
                        )
                }
            </PopoverContent>
        </Popover>
    );
};


interface NotificationItemProps {
    handlePopoverClose: () => void;
    data: Awaited<ReturnType<NonNullable<ReturnType<typeof notificationsOptions>["queryFn"]>>>[0];
}


const NotificationItem = ({ data, handlePopoverClose }: NotificationItemProps) => {
    const to = data.mediaType ? `/details/${data.mediaType}/${data.mediaId}` : `/profile/${data.payload?.username}`;

    return (
        <Link to={to} onClick={handlePopoverClose}>
            <div className="py-2.5 px-3.5 hover:bg-neutral-600/20">
                <div className="flex items-center gap-2">
                    {data.mediaType ?
                        <div className="grid grid-cols-[0fr_1fr_0fr] items-center gap-3">
                            <MediaAndUserIcon type={data.mediaType} size={16}/>
                            <div className="truncate">{data.payload?.name}</div>
                            {((data.mediaType === "anime" || data.mediaType === "series") && data.payload?.finale) &&
                                <Badge>Finale</Badge>
                            }
                        </div>
                        :
                        <>
                            <MediaAndUserIcon type="user" size={16}/>
                            <div className="line-clamp-1">{data.payload?.message}</div>
                        </>
                    }
                </div>
                {data.mediaType &&
                    <div className="flex items-center gap-2 text-neutral-500">
                        {data.payload?.new ?
                            <div className="line-clamp-1">{data.payload.message}</div>
                            :
                            <>
                                <div>
                                    {(data.mediaType === MediaType.ANIME || data.mediaType === MediaType.SERIES) ?
                                        <div>{`S${data.payload?.season}.E${data.payload?.episode}`}</div>
                                        :
                                        <div>Release</div>
                                    }
                                </div>
                                <div><MoveRight size={17}/></div>
                                <div>{formatDateTime(data.payload?.release_date)}</div>
                            </>
                        }
                    </div>
                }
            </div>
            <Separator className="mt-0 mb-0"/>
        </Link>
    );
};
