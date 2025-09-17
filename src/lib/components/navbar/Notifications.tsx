import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/components/ui/badge";
import {Button} from "@/lib/components/ui/button";
import {useRef, useState} from "react";
import {MediaType} from "@/lib/server/utils/enums";
import {formatDateTime, zeroPad} from "@/lib/utils/functions";
import {useSheet} from "@/lib/contexts/sheet-context";
import {Separator} from "@/lib/components/ui/separator";
import {Bell, LoaderCircle, MoveRight} from "lucide-react";
import {MutedText} from "@/lib/components/general/MutedText";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {MediaAndUserIcon} from "@/lib/components/media/base/MediaAndUserIcon";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {notificationsCountOptions, notificationsOptions, queryKeys} from "@/lib/react-query/query-options/query-options";


export const Notifications = ({ isMobile }: { isMobile?: boolean }) => {
    const { setSheetOpen } = useSheet();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const popRef = useRef<HTMLButtonElement>(null);
    const { data: notifCount = 0 } = useQuery(notificationsCountOptions());
    const { data: notifs = [], isLoading, refetch } = useQuery(notificationsOptions());

    const handleOnClickOpen = async () => {
        await refetch();
        setIsOpen(true);
        queryClient.setQueryData(queryKeys.notificationCountKey(), 0);
    };

    const handlePopoverClose = () => {
        popRef?.current?.click();
        setSheetOpen(false);
    };

    return (
        <Popover modal={isMobile} open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={handleOnClickOpen}>
                        <Bell className={cn("size-5", isMobile && "size-4 text-muted-foreground ml-1")}/>
                        {isMobile && <div className="text-base ml-2 mr-1">Notifications</div>}
                        <Badge variant="notification" className={cn(notifCount > 0 && "bg-destructive")}>
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
            <div className="py-2.5 px-2.5 hover:bg-neutral-600/20">
                <div className="flex items-center gap-2">
                    {data.mediaType ?
                        <div className="grid grid-cols-[0fr_1fr_0fr] items-center gap-2">
                            <MediaAndUserIcon type={data.mediaType} size={16}/>
                            <div className="truncate">{data.payload?.name}</div>
                            {((data.mediaType === MediaType.ANIME || data.mediaType === MediaType.SERIES) && data.payload?.finale) &&
                                <Badge variant="passive">Finale</Badge>
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
                    <div className="flex items-center gap-2 text-neutral-400">
                        {data.payload?.new ?
                            <div className="line-clamp-1">{data.payload.message}</div>
                            :
                            <>
                                <div>
                                    {(data.mediaType === MediaType.ANIME || data.mediaType === MediaType.SERIES) ?
                                        <div>S{zeroPad(data.payload?.season)}.E{zeroPad(data.payload?.episode)}</div>
                                        :
                                        <div>Release</div>
                                    }
                                </div>
                                <div><MoveRight size={17}/></div>
                                <div>{formatDateTime(data.payload?.release_date, { noTime: true })}</div>
                            </>
                        }
                    </div>
                }
            </div>
            <Separator className="mt-0 mb-0"/>
        </Link>
    );
};
