import {Trophy} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {useAuth} from "@/lib/hooks/use-auth";
import {HofUserData} from "@/lib/types/query.options.types";
import {Card, CardContent} from "@/lib/components/ui/card";
import {capitalize, computeLevel} from "@/lib/utils/functions";
import {MediaLevelCircle} from "@/lib/components/general/MediaLevelCircle";


interface HofCardProps {
    userData: HofUserData;
}


export const HofCard = ({ userData }: HofCardProps) => {
    const { currentUser } = useAuth();

    return (
        <Card key={userData.name} className={cn("p-2 py-0 mb-3 bg-card", currentUser?.id === userData.id && "bg-teal-950")}>
            <CardContent className="p-0">
                <div className="grid grid-cols-12 py-4">
                    <div className="col-span-1 max-sm:col-span-2">
                        <div className="flex items-center ml-2 text-xl h-full font-medium">
                            {userData.rank === 1 ? <Trophy className="text-amber-500 w-6 h-6"/> : <>#{userData.rank}</>}
                        </div>
                    </div>
                    <div className="col-span-6 max-sm:col-span-10 ml-3">
                        <div className="flex items-center gap-4 h-full">
                            <img
                                src={userData.image!}
                                alt={"profile-picture"}
                                className="rounded-full h-[75px] w-[75px] border-2 border-amber-600 bg-neutral-500"
                            />
                            <div className="space-y-2">
                                <h3 className="text-xl font-medium">
                                    <Link to="/profile/$username" params={{ username: userData.name }} className="hover:underline hover:underline-offset-2">
                                        {userData.name}
                                    </Link>
                                </h3>
                                <div className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r
                                from-blue-600 to-violet-600">
                                    Lvl {Math.floor(computeLevel(userData.totalTime))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-5 -ml-8">
                        <div className="grid grid-cols-3 gap-2 text-center max-sm:hidden">
                            {userData.settings.map((s) =>
                                <Link
                                    key={s.mediaType}
                                    disabled={!s.active}
                                    to="/list/$mediaType/$username"
                                    params={{ mediaType: s.mediaType, username: userData.name }}
                                >
                                    <MediaLevelCircle
                                        isActive={s.active}
                                        mediaType={s.mediaType}
                                        intLevel={Math.floor(computeLevel(s.timeSpent))}
                                    />
                                    <div className="text-xs font-semibold text-gray-400">
                                        {capitalize(s.mediaType)}
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
