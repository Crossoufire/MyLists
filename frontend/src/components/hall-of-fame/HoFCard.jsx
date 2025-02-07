import {useAuth} from "@/api";
import {Trophy} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {capitalize, cn} from "@/utils/functions";
import {Card, CardContent} from "@/components/ui/card";
import {MediaLevelCircle} from "@/components/app/MediaLevelCircle";


export const HoFCard = ({ user }) => {
    const { currentUser } = useAuth();

    return (
        <Card key={user.username} className={cn("p-2 py-0 mb-3 bg-card", currentUser.id === user.id && "bg-teal-950")}>
            <CardContent className="p-0">
                <div className="grid grid-cols-12 py-4">
                    <div className="col-span-1 max-sm:col-span-2">
                        <div className="flex items-center ml-2 text-xl h-full font-medium">
                            {user.rank === 1 ? <Trophy className="text-amber-500 w-6 h-6"/> : <>#{user.rank}</>}
                        </div>
                    </div>
                    <div className="col-span-6 max-sm:col-span-10 ml-3">
                        <div className="flex items-center gap-4 h-full">
                            <img
                                alt="profile-picture"
                                src={user.profile_image}
                                className="rounded-full h-[75px] w-[75px] border-2 border-amber-600"
                            />
                            <div className="space-y-2">
                                <h3 className="text-xl font-medium">
                                    <Link to={`/profile/${user.username}`} className="hover:underline hover:underline-offset-2">
                                        {user.username}
                                    </Link>
                                </h3>
                                <div className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r
                                from-blue-600 to-violet-600">
                                    Lvl {user.profile_level}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-5 -ml-8">
                        <div className="grid grid-cols-3 gap-2 text-center max-sm:hidden">
                            {user.settings.map(s =>
                                <Link key={s.media_type} to={`/list/${s.media_type}/${user.username}`} disabled={!s.active}>
                                    <MediaLevelCircle
                                        isActive={s.active}
                                        mediaType={s.media_type}
                                        intLevel={parseInt(s.level)}
                                    />
                                    <div className="text-xs font-semibold text-gray-400">
                                        {capitalize(s.media_type)}
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
