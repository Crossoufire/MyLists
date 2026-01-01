import {useRef, useState} from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useBreakpoint} from "@/lib/client/hooks/use-breakpoint";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {MainThemeIcon} from "@/lib/client/components/general/MainThemeIcons";
import {formatDateTime, formatRelativeTime, zeroPad} from "@/lib/utils/formating";
import {Bell, LoaderCircle, MessageCircleOff, MoveRight, User} from "lucide-react";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {notificationsCountOptions, notificationsOptions} from "@/lib/client/react-query/query-options/query-options";


export const Notifications = () => {
    const queryClient = useQueryClient();
    const isBelowLg = useBreakpoint("lg");
    const [isOpen, setIsOpen] = useState(false);
    const popRef = useRef<HTMLButtonElement>(null);
    const { data: notifCount = 0 } = useQuery(notificationsCountOptions);
    const { data: notifs = [], isLoading, refetch } = useQuery(notificationsOptions);

    const handleOnClickOpen = async () => {
        await refetch();
        setIsOpen(true);
        queryClient.setQueryData(notificationsCountOptions.queryKey, 0);
    };

    const handlePopoverClose = () => {
        popRef?.current?.click();
    };

    return (
        <Popover modal={isBelowLg} open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative flex items-center">
                    <Button variant="ghost" size="sm" onClick={handleOnClickOpen} className="rounded-full h-10">
                        <Bell className="size-5"/>
                        {notifCount > 0 &&
                            <span className="absolute top-2.5 right-2.5 size-1 bg-red-500 rounded-full animate-pulse"/>
                        }
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverClose ref={popRef} className="absolute"/>
            <PopoverContent className="p-0 w-80 max-h-76 overflow-y-auto scrollbar-thin max-sm:max-h-88" align="end">
                <div className="px-5 py-3 mb-1 border-b flex justify-between items-center bg-accent/20">
                    <span className="font-semibold text-sm text-primary">
                        Notifications
                    </span>
                </div>
                {isLoading ?
                    <div className="flex items-center justify-center py-10 px-6">
                        <LoaderCircle className="size-6 animate-spin"/>
                    </div>
                    :
                    notifs.length === 0 ?
                        <EmptyState
                            className="py-6"
                            icon={MessageCircleOff}
                            message="No Notification to display"
                        />
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
    data: Awaited<ReturnType<NonNullable<typeof notificationsOptions.queryFn>>>[number];
}


const NotificationItem = ({ data, handlePopoverClose }: NotificationItemProps) => {
    return (
        <div className="px-3">
            {data.mediaType ?
                <div className="flex gap-3 py-3 px-2 border-b hover:bg-muted/30 rounded-lg">
                    <div className="mt-0.5">
                        <div className="flex items-center justify-center">
                            <MainThemeIcon
                                type={data.mediaType}
                                className="size-4 mt-0.5"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <p className="text-sm">
                                <Link
                                    search={{ external: false }}
                                    onClick={handlePopoverClose}
                                    to="/details/$mediaType/$mediaId"
                                    params={{ mediaType: data.mediaType, mediaId: data.mediaId! }}
                                >
                                    <span title={data.payload.name} className="font-medium text-foreground line-clamp-1 hover:text-app-accent">
                                        {data.payload.name}
                                    </span>
                                </Link>
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {formatRelativeTime(data.timestamp)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary/80">
                                <span>
                                    {(data.mediaType === MediaType.ANIME || data.mediaType === MediaType.SERIES) ?
                                        <div>S{zeroPad(data.payload?.season)}.E{zeroPad(data.payload?.episode)}</div>
                                        :
                                        <div>Release</div>
                                    }
                                </span>
                                <MoveRight className="size-4 text-app-accent"/>
                                <span>
                                    {formatDateTime(data.payload?.release_date, { noTime: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                :
                <div className="flex gap-3 py-3 px-2 border-b hover:bg-muted/30 rounded-lg">
                    <div className="mt-0.5">
                        <div className="flex items-center justify-center">
                            <User className="size-4 mt-0.5 text-muted-foreground"/>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <p className="text-sm">
                                <Link
                                    to="/profile/$username"
                                    onClick={handlePopoverClose}
                                    params={{ username: data.payload.username }}
                                >
                                    <span title={data.payload.username} className="font-medium text-foreground line-clamp-1 hover:text-app-accent">
                                        {data.payload.username}
                                    </span>
                                </Link>
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {formatRelativeTime(data.timestamp)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary/80">
                                <span>
                                    {data.payload.message}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};
