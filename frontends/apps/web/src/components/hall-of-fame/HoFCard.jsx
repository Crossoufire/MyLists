import React from "react";
import {cn} from "@/utils/functions";
import {useAuth} from "@mylists/api/src";
import {Link} from "@tanstack/react-router";
import {Card, CardContent} from "@/components/ui/card";
import {ListItem} from "@/components/hall-of-fame/ListItem";


export const HoFCard = ({ user }) => {
    const { currentUser } = useAuth();
    const { series, anime, movies, books, games } = user.settings;
    const settings = [series, anime, movies, books, games];

    return (
        <Card key={user.username} className={cn("p-2 mb-5 bg-card", currentUser.id === user.id && "bg-teal-950")}>
            <CardContent className="max-sm:py-5 p-0">
                <div className="grid grid-cols-12 max-md:gap-8 py-4">
                    <div className="col-span-3 md:col-span-1">
                        <div className="flex items-center justify-center text-xl h-full font-medium">
                            #{user.rank}
                        </div>
                    </div>
                    <div className="col-span-9 md:col-span-4">
                        <div className="flex items-center gap-6">
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
                                <div className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600">
                                    Lvl {user.profile_level}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-7 max-md:col-span-12">
                        <div className="flex justify-center items-center font-medium h-full gap-8 max-md:gap-6">
                            {settings.map(setting =>
                                <ListItem
                                    setting={setting}
                                    key={setting.media_type}
                                    username={user.username}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
