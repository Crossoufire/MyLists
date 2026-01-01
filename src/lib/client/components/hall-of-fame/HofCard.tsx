import {useState} from "react";
import {Trophy} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {capitalize} from "@/lib/utils/formating";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {computeLevel} from "@/lib/utils/compute-level";
import {HofUserData} from "@/lib/types/query.options.types";
import {useBreakpoint} from "@/lib/client/hooks/use-breakpoint";
import {Card, CardContent} from "@/lib/client/components/ui/card";
import {MediaLevel} from "@/lib/client/components/general/MediaLevel";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";


interface HofCardProps {
    userData: HofUserData;
}


export const HofCard = ({ userData }: HofCardProps) => {
    const { currentUser } = useAuth();
    const isBelowSm = useBreakpoint("sm");
    const [isOpen, setIsOpen] = useState(false);

    const handleMobileToggle = () => {
        if (isBelowSm) {
            setIsOpen((prev) => !prev);
        }
    };

    return (
        <Card
            key={userData.name}
            onClick={handleMobileToggle}
            className={cn("p-2 py-0 mb-3 bg-card", currentUser?.id === userData.id && "bg-app-accent/5 border-app-accent/50")}
        >
            <CardContent className="p-0">
                <div className="grid grid-cols-12 py-4">
                    <div className="col-span-1 max-sm:col-span-2">
                        <div className="flex items-center ml-2 text-xl h-full font-medium">
                            {userData.rank === 1 ?
                                <Trophy className="text-app-rating size-6"/>
                                :
                                <>#{userData.rank}</>
                            }
                        </div>
                    </div>
                    <div className="col-span-6 max-sm:col-span-10 ml-3">
                        <div className="flex items-center gap-4 h-full">
                            <ProfileIcon
                                fallbackSize="text-xl"
                                className="size-19 border-2"
                                user={{ image: userData.image, name: userData.name }}
                            />
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium sm:truncate sm:w-38">
                                    <Link to="/profile/$username" params={{ username: userData.name }}>
                                        {userData.name}
                                    </Link>
                                </h3>
                                <div className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-linear-to-r
                                from-blue-600 to-violet-600">
                                    Lvl {Math.floor(computeLevel(userData.totalTime))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-5 sm:-ml-10 max-sm:col-span-12 max-sm:mt-2">
                        <div className={cn("grid grid-cols-3 gap-2 text-center transition-all duration-300", {
                            "max-sm:max-h-0 max-sm:overflow-hidden max-sm:opacity-0": !isOpen,
                            "max-sm:max-h-40 max-sm:opacity-100": isOpen,
                        })}>
                            {userData.settings.map((setting) =>
                                <Link
                                    key={setting.mediaType}
                                    disabled={!setting.active}
                                    to="/list/$mediaType/$username"
                                    params={{ mediaType: setting.mediaType, username: userData.name }}
                                >
                                    <MediaLevel
                                        isActive={setting.active}
                                        mediaType={setting.mediaType}
                                        timeSpent={setting.timeSpent}
                                    />
                                    <div className="text-xs font-semibold text-muted-foreground">
                                        {capitalize(setting.mediaType)}
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
